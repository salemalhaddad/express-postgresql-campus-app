import datetime
import dv_processing as dv
import cv2 as cv
import argparse
import numpy as np
from matplotlib import pyplot as plt

# Functions
import HSV_filter as hsv
import shape_recognition as shape
import triangulation as tri
import imutils

#import calibration as calib

B = 14
FocalLength_L= [1.081948901312753e+03,1.079418010752335e+03]
FocalLength_R= [1.094335338270355e+03,1.092465015498023e+03]
focal_len = (FocalLength_L[0] + FocalLength_R[0]) / 2.0
alpha= 32.78

parser = argparse.ArgumentParser(
    description='Show a preview of a stereo event stream from a pair of time-synchronized iniVation cameras.')

args = parser.parse_args()

# Open the cameras
camera = dv.io.StereoCapture("CAM1", "CAM2")

resolution_left= camera.left.getEventResolution()
resolution_right = camera.right.getEventResolution()

leftVis = dv.visualization.EventVisualizer(camera.left.getEventResolution())
rightVis = dv.visualization.EventVisualizer(camera.right.getEventResolution())

# Create the preview windows
cv.namedWindow("Left", cv.WINDOW_NORMAL)
cv.namedWindow("Right", cv.WINDOW_NORMAL)

slicer = dv.StereoEventStreamSlicer()

keepRunning = True


class DepthMap:
    def __init__(self, imgLeft, imgRight, showImages=False):
        self.imgLeft = cv.cvtColor(imgLeft, cv.COLOR_BGR2GRAY)
        self.imgRight = cv.cvtColor(imgRight, cv.COLOR_BGR2GRAY)
        # self.showImages = showImages

    def computeDepthMapSGBM(self):
        window_size = 7
        min_disp = 16
        nDispFactor= 2
        num_disp = 16 * nDispFactor - min_disp  # Must be divisible by 16

        stereo = cv.StereoSGBM_create(
            minDisparity=16,
            numDisparities=num_disp,
            blockSize=window_size,
            P1=8 * 3 * window_size ** 2,
            P2=32 * 3 * window_size ** 2,
            disp12MaxDiff=1,
            uniquenessRatio=10,
            speckleWindowSize=0,
            speckleRange=2,
            preFilterCap=63,
            mode=cv.STEREO_SGBM_MODE_SGBM_3WAY
        )

        disparity = stereo.compute(self.imgLeft, self.imgRight).astype(np.float32) / 16.0

        # if self.showImages:
        #     plt.imshow(disparity, 'gray')
        #     plt.title('SGBM Disparity Map')
        #     plt.colorbar()
        #     plt.show()

        return disparity

def preview(left, right):
    global Left_frame, Right_frame, keepRunning
    Left_frame = leftVis.generateImage(left)
    Right_frame = rightVis.generateImage(right)

    mask_right = hsv.add_HSV_filter(Right_frame, 1)
    mask_left = hsv.add_HSV_filter(Left_frame, 1)


    # APPLYING SHAPE RECOGNITION:
    circles_right = shape.find_circles(Right_frame, mask_right)
    circles_left  = shape.find_circles(Left_frame, mask_left)


    # If no ball can be caught in one camera show text "TRACKING LOST"
    if np.all(circles_right) == None or np.all(circles_left) == None:
        cv.putText(Right_frame, "TRACKING LOST", (75,50), cv.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255),2)
        cv.putText(Left_frame, "TRACKING LOST", (75,50), cv.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255),2)

    else:
        depth = tri.find_depth(circles_right, circles_left, Right_frame, Left_frame, B, focal_len, alpha)

        cv.putText(Right_frame, "TRACKING", (75,50), cv.FONT_HERSHEY_SIMPLEX, 0.7, (124,252,0),2)
        cv.putText(Left_frame, "TRACKING", (75,50), cv.FONT_HERSHEY_SIMPLEX, 0.7, (124,252,0),2)
        cv.putText(Right_frame, "Distance: " + str(round(depth,3)), (200,50), cv.FONT_HERSHEY_SIMPLEX, 0.7, (124,252,0),2)
        cv.putText(Left_frame, "Distance: " + str(round(depth,3)), (200,50), cv.FONT_HERSHEY_SIMPLEX, 0.7, (124,252,0),2)
        # Multiply computer value with 205.8 to get real-life depth in [cm]. The factor was found manually.
        print("Depth: ", depth)


    # Dense disparity (optional)
    depth_map = DepthMap(Left_frame, Right_frame)
    disparity = depth_map.computeDepthMapSGBM()
    disp_vis = cv.normalize(disparity, None, 0, 255, cv.NORM_MINMAX, cv.CV_8U)
    cv.imshow("Disparity Map (SGBM)", disp_vis)
    # Show the frames
    cv.imshow("frame right", Right_frame)
    cv.imshow("frame left", Left_frame)
    # cv.imshow("mask right", mask_right)
    # cv.imshow("mask left", mask_left)

    if cv.waitKey(2) == 27:
        # global keepRunning
        keepRunning = False


slicer.doEveryTimeInterval(datetime.timedelta(milliseconds=33), preview)

while keepRunning:
    # if reading fails, just pass an empty event store
    slicer.accept(camera.left.getNextEventBatch() or dv.EventStore(),
                  camera.right.getNextEventBatch() or dv.EventStore())
