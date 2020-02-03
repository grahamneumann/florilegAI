const Flickr = require('flickr-sdk');
const fs = require('fs');
const download = require('download-file')
const lineByLine = require('n-readlines');

const flickr = new Flickr("<apikey>");

// Main
module.exports = () => {

  let biodivlibrary_nsid = null;
  flickr.people.findByUsername({
    username: "BioDivLibrary"
  }).then(function (res) {
    biodivlibrary_nsid = res.body.user.nsid;
  });

  getImageUrls(1, 60);
  downloadAllImages();
}

function getImageUrls(curPage, maxPages)
{
  //https://www.flickr.com/search/?user_id=61021753@N02&view_all=1&tags=botany

  flickr.photos.search({
    user_id: "61021753@N02",
    tags: "botany",
    tag_mode: "all",
    sort: "date-posted-asc",
    page: curPage,
    per_page: 500,
    extras: "owner_name"
  }).then(function (res) {
    console.log('page ' + res.body.photos.page + ' of ' + res.body.photos.pages);

    for (const photo of res.body.photos.photo) {

	    //https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{o-secret}_o.(jpg|gif|png)
		/*
		s	small square 75x75
		q	large square 150x150
		t	thumbnail, 100 on longest side
		m	small, 240 on longest side
		n	small, 320 on longest side
		-	medium, 500 on longest side
		z	medium 640, 640 on longest side
		c	medium 800, 800 on longest side†
		b	large, 1024 on longest side*
		h	large 1600, 1600 on longest side†
		k	large 2048, 2048 on longest side†
		o	original image, either a jpg, gif or png, depending on source format
		*/
      
      	const photoUrl = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + "_z" + ".jpg";
      	fs.appendFileSync('urls.txt', photoUrl + '\n');
    }

    if ((res.body.photos.page < res.body.photos.pages) && curPage < maxPages) {
      getImageUrls(curPage + 1, maxPages);
    }
  }).catch(function (err) {
    console.error('bonk', err);
  });
}

async function downloadAllImages() {

  console.log(process.cwd());

  const lineReader = new lineByLine('./urls.txt');
  let skipTo = 4496;
  let imageNum = 1;
  let line;
  while (line = lineReader.next()) {
    if (imageNum >= skipTo) {
      const url = line.toString('ascii').trim();
      await downloadUrl(url, imageNum);
      console.log("Downloaded image " + imageNum);
    }
    imageNum++;
  };
}


function downloadUrl(url, imageNum) {
  return new Promise((resolve, reject) => {

    try {
      download(url, {directory: "./img", filename: "file_" + imageNum + ".jpg"}, function (err) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        resolve();
      })
    } catch (e) {
      console.log(e);
    }
  });
}



