#!/usr/bin/env bash
# SP-1·SP-3 테스트 파일을 만든다. 직접 만든 클릭 트랙만 쓴다(상업 음원 금지).
# 박: 1.000초부터 0.5초마다(120 BPM), 1kHz 30ms 비프. 길이 180초.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p spike-assets
ffmpeg -hide_banner -loglevel error -y -f lavfi \
  -i "aevalsrc='if(gte(t,1)*lt(mod(t-1,0.5),0.03),0.8*sin(2*PI*1000*t),0)':s=48000:d=180" \
  -c:a pcm_s16le spike-assets/beats.wav
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "testsrc2=s=640x360:r=30:d=180" -i spike-assets/beats.wav \
  -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -shortest spike-assets/beats-test.mp4
ffmpeg -hide_banner -loglevel error -y -i spike-assets/beats.wav -c:a aac -b:a 128k spike-assets/beats-test.m4a
for f in spike-assets/beats.wav spike-assets/beats-test.mp4 spike-assets/beats-test.m4a; do
  printf '%s  %ss\n' "$f" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
done
