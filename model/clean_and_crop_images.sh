#!/bin/bash
SRC=./img
TRGT=./img_cleaned

for f in $SRC/*.jpg; do
  fn=`basename "$f"`
  echo $fn
  # take action on each file. $f store current file name
  convert "$f" -crop 5x280+0+20 -resize 1x1 color.jpg
  color=$(convert color.jpg -format '%[pixel:p{0,0}]' info:-)
  convert "$f" -fuzz 5% -fill $color -draw "color 5,5 replace" "$TRGT/$fn"
done

mogrify -gravity Center -crop 256x256+0+0 +repage "$TRGT/*.jpg"
