#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p build/classes
find src/main/java -name '*.java' > build/sources.txt
javac -encoding UTF-8 --release 17 -d build/classes @build/sources.txt
cp -R src/main/resources/. build/classes/
jar --create --file build/GRD-Neon-Encore.jar --main-class grd.NativeClient -C build/classes .
java -Djava.awt.headless=true -jar build/GRD-Neon-Encore.jar --self-test
