from __future__ import absolute_import, division, print_function, unicode_literals

import numpy as np
import matplotlib.pyplot as plt
import os

import warnings
warnings.filterwarnings('ignore')

from tensorflow.python.keras.models import load_model
import tensorflow as tf


print("tensorflow version: " + tf.__version__)

print("loading model...")
model = load_model('./app/models/florilegai_gen4_30000.h5')


def gen_image(seed=0):

	if seed == 0:
		np.random.seed()
	else:
		np.random.seed(seed)

	print("seed="+str(seed))
			
	noise = np.random.normal(0, 1, (1, 100))

	imgFileName = 'gen.png'
	
	gen_imgs = model.predict(noise)
	gen_imgs = 0.5 * gen_imgs + 0.5
	plt.switch_backend('Agg')
	plt.imsave('./app/img/' + imgFileName, gen_imgs[0])
	plt.close()
	
	print("generated " + imgFileName)
	
	return imgFileName


