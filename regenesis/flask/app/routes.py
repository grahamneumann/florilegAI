from flask import render_template
from flask import request
from flask import send_file
from app import app


from . import generator


@app.route('/')
@app.route('/index')
def index():
	user = {'username': 'graham'}
	return render_template('index.html', title='FlorilegAI', user=user)


        
@app.route('/genImage', methods=['GET'])
def api_genImage():

	seed = request.args.get('seed')
	if seed is None:
		seed = "0";
	
	imgFileName = generator.gen_image(int(seed))
	return send_file('img/' + imgFileName, mimetype='image/png')        
