# The installation of TinyOS 2.1.2

TOSSIM simulates entire TinyOS applications. It works by replacing components with simulation implementations. The level at which components are replaced is very flexible: for example, there is a simulation implementation of millisecond timers that replaces HilTimerMilliC, while there is also an implementation for atmega128 platforms that replaces the HPL components of the hardware clocks. The former is general and can be used for any platform, but lacks the fidelity of capturing an actual chip's behavior, as the latter does. Similarly, TOSSIM can replace a packet-level communication component for packet-level simulation, or replace a low-level radio chip component for a more precise simulation of the code execution. TOSSIM is a discrete event simulator. When it runs, it pulls events of the event queue (sorted by time) and executes them. Depending on the level of simulation, simulation events can represent hardware interrupts or high-level system events (such as packet reception). Additionally, tasks are simulation events, so that posting a task causes it to run a short time (e.g., a few microseconds) in the future.

TOSSIM is a library: you must write a program that configures a simulation and runs it. TOSSIM supports two programming interfaces: Python and C++. Python allows you to interact with a running simulation dynamically, like a powerful debugger. However, since the interpretator can be a performance bottleneck when obtaining results, TOSSIM also has a C++ interface. Usually, transforming code from one to the other is very simple.

TOSSIM currently does not support gathering power measurements. (But it can be fixed by add the plugin called PowerTossimZ)

Before the tutorial, I want to emphasize something that may challenge your patience and your ability
when you explore how to install TinyOS correctly. If the direction is wrong, you will waste much time.
Espeically, sometimes the wrong installation only breaks a part of functions of TinyOS and if you will
not be aware of it until you use it (e.g., the Tossim funcitons).
That is,

* If try to install TinyOS 2.1.1, your OS would better be Ubuntu 12.04 or lower versions. Due to TinyOS 2.1.1 is the old version and its library relies on two things: suitable gcc (<4.8) and suitable glibc (< 2.7). 
I once tried to install this version on Ubuntu 18.04 - I compiled gcc 4.5.3 on Ubuntu 18.04 and meets many 
issues. Luckily, I soloved all issues but I finally failed at that my glibc version is too high.

* If try to install TinyOS 2.1.2, your OS would better be Ubuntu 14.04 or 16.04 (not 18.04).

Now let's start the tutorial.<br/>

1\. Open /etc/apt/sources.list ，add the source in the end of the file：<br/>
deb http://tinyos.stanford.edu/tinyos/dists/ubuntu lucid main <br/>
**Do not add other sources about TinyOS to this file!**

2\. Execute the update of apt:<br/>
$ sudo apt-get update

3\. Install TinyOS and its libraries: <br/>
$ sudo apt-get install tinyos-2.1.2

4\. Set the environment: <br/>
Consider there is no tinyos.sh in folder tinyos-2.1.2, now we have build a new one: <br/>
$ cd /opt/tinyos-2.1.2 <br/>
$ sudo vim tinyos.sh

Input these contents:

\#! /usr/bin/env bash <br/>
export TOSROOT="/opt/tinyos-2.1.2" <br/>
export TOSDIR="/opt/tinyos-2.1.2/tos" <br/>
export CLASSPATH="$CLASSPATH:$TOSROOT/support/sdk/java/tinyos.jar:." <br/>
export MAKERULES="/opt/tinyos-2.1.2/support/make/Makerules" <br/>
export PATH="/opt/msp430/bin:/opt/jflashmm:$PATH" <br/>

Now we edit .bashrc to make tinyos.sh script to be executed when we launch bash. <br/>
$ sudo vim ~/.bashrc <br/>

Add these contents at the end of .bashrc:<br/>
\#Sourcing the tinyos environment variable setup script <br/>
source /opt/tinyos-2.1.2/tinyos.sh

Then we update the setting of .bashrc:<br/>
$ source ~/.bashrc <br/>


5\. Install JNI and g++
$ sudo tos-install-jni <br/>
$ sudo apt-get install g++

6\. Close all terminals, and then reboot terminal to make sure the setting 
works.

7\. Execute **tos-check-env** to check whether the installation is finished well<br/>
$ tos-check-env 

**Usually, there will be 2 Warnings - 1. your java version is not 1.4 or 1.5 (You just need to make sure your java version is higher than 1.5); 2. graphviz version is wrong (Just ignore it!)**

8\. Install python-dev<br/>
$ sudo apt-get install python2.7-dev

9\. Test
Blink a simple program and now try to compile it:<br/>
$ sudo chmod -R 777 /opt/tinyos-2.1.2/<br/>
**This step is try to let python to read files of tinyos**<br/>
$ cd /opt/tinyos-2.1.2/apps/Blink<br/>
$ make micaz sim<br/>

**If you see build successfully, then you succeed. If not, just figure out what is the problem.**

10\. Download the program to TELOSB node<br/>
$ cd /opt/tinyos-2.1.2/apps/Blink<br/>
$ make telsob<br/>
$ motelist<br/>
$ sudo chmod 666 /dev/ttyUSB0     **//change the authority of port, or you will get an error of connection<br/>**
$ make telosb reinstall bsl,/dev/ttyUSB0<br/>

## Attention
1\. The difference between “install” and “reinstall” is that the former compiles program, sets the address of node and downloads program to the node; and the latter does not has the compile process.

2\. Install TinyOS Make System Version 3<br/>
If you find an error that does not find aclocal, then:<br/>
$ sudo apt-get install automake