# Emulating Embedded Linux Devices with QEMU

The source of the article is https://www.novetta.com/2018/02/emulating-embedded-linux-devices-with-qemu/ by Novetta.

Recently Internet of Things (IoT) device security has come into mainstream focus. With the rise of IoT botnets (like Mirai), IoT devices are receiving increasingly more attention from both attackers and security researchers.

For people new to the world of binary exploitation, many embedded Linux devices are an attractive target to learn various vulnerability research techniques. Most embedded devices lack the security features of modern Operating Systems (OSs), such as memory protections (Data Execution Prevention (DEP)/exec-shield/etc; basically W^X page permissions), stack cookies, strong Address Space Layout Randomization (ASLR) and control flow integrity solutions (such as CFG). The lack of protections, paired with the poor quality of the code commonly found on most IoT/embedded devices, makes these devices an ideal way to learn the basics of vulnerability research.

One of the more challenging things for people new to the embedded Linux world is figuring out how to test the vulnerabilities they find. Since most of these devices are not x86/x64, you can’t emulate them with VMWare like you can with standard desktop/server OSs. This blog post will cover different ways to emulate embedded Linux devices and teach new users to configure an emulation environment with minimal frustration.

This blog post will draw heavily from material posted by posted by Craig on his excellent devttys0 blog as well as material posted by Zachary Cutlip on his personal blog. Check out both of these sites as they are excellent sources of information.
What is QEMU?

Perhaps the most succinct description comes from the project’s website, which states “QEMU is a generic and open source machine emulator and virtualizer”. QEMU is different from something like VMWare player because it can emulate non-x86/x64 hardware. This blog post will mostly be focused on emulating MIPS binaries/devices, but the same principles apply for any architecture you wish to emulate with QEMU.

QEMU can run in two modes: user mode and system mode.

    User mode allows you to run non-native binaries on your host OS (e.g. running a MIPS binary on an x64 system).
    System mode acts like a more traditional hypervisor where it emulates the underlying hardware and virtualizes the guest OS.

Both user mode and system mode have their uses.

##Step 1: System Configuration

For this example I will be using an Ubuntu Linux 16.04 VM. The first step is to install tools to help us with the emulation process. The first is QEMU itself. Run the following command to install QEMU and its associated components:

$ sudo apt-get -y install qemu qemu-system qemu-user-static qemu-user

The next tools we need to install are radare2 and binwalk. Radare2 is an open source reverse engineering framework we’ll use to glean information about the type of device we are looking at. While there is a version of radare2 in the apt repository, it is very out of date. We should install radare2 from github. First, install the build-essential package:

$ sudo apt-get -y install build-essential

Now we can clone radare2 from github and install it:

$ git clone https://github.com/radare/radare2.git  
$ cd radare2; sys/install.sh; cd ..

After installing radare2, the next tool we need is binwalk. Binwalk is a tool that was developed by devttys0 that is used for extracting embedded device firmware. First install some basic dependencies:

$ sudo apt-get -y install python python-pip python-dev

Now we can clone binwalk from github and install it:

$ git clone https://github.com/ReFirmLabs/binwalk.git  
$ cd binwalk; sudo ./deps.sh; sudo python setup.py install; cd ..

At this point we have installed all the tools we need.

##Step 2: Getting device firmware

Since we are emulating an embedded device, we need embedded device firmware. Most vendors have an HTTP or an FTP server where you can download their firmware. For this post I selected the D-Link DIR-866L Dual Band Gigabit Cloud Router to emulate. The following command will download the correct firmware:

$ wget ftp://ftp2.dlink.com/PRODUCTS/DIR-866L/REVA/DIR-866L_REVA_FIRMWARE_1.00.B07.ZIP

##Step 3: Extracting device firmware

Binwalk makes extracting the device firmware very simple. First we need to uncompress the zip file:

$ sudo apt-get -y install unzip  
$ unzip DIR-866L_REVA_FIRMWARE_1.00.B07.ZIP

Next we use binwalk to extract the firmware (note: if you are running a Linux VM, do not dump the firmware images on an hgfs or vboxsf partition since these file systems do not preserve the symlink structure by default):

$ binwalk -e DIR866LA1_FW100B07.bin

DECIMAL HEXADECIMAL DESCRIPTION
--------------------------------------------------------------------------------
0 0x0 uImage header, header size: 64 bytes, header CRC: 0xC6198A5E, created: 2014-07-18 09:35:02, image size: 1445259 bytes, Data Address: 0x80002000, Entry Point: 0x80317E00, data CRC: 0x184A6EC1, OS: Linux, CPU: MIPS, image type: OS Kernel Image, compression type: lzma, image name: "Linux Kernel Image"
64 0x40 LZMA compressed data, properties: 0x5D, dictionary size: 8388608 bytes, uncompressed size: 4252160 bytes
1507328 0x170000 Squashfs filesystem, little endian, version 4.0, compression:lzma, size: 9641647 bytes, 1259 inodes, blocksize: 65536 bytes, created: 2014-07-18 09:35:27
$

As we can see in the output above, binwalk automatically identified and extracted the squashfs image from the firmware blob, so we can investigate it. We do this by changing into the extracted directory and listing the contents:

$ cd _DIR866LA1_FW100B07.bin.extracted/squashfs-root/  
$ ls -al  
total 80  
drwxr-xr-x 18 user user 4096 Jul 18 2014 .  
drwxrwxr-x 3 user user 4096 Feb 1 15:10 ..  
drwxr-xr-x 2 user user 4096 Jul 18 2014 bin  
drwxr-xr-x 4 user user 4096 Jul 18 2014 dev  
drwxr-xr-x 15 user user 4096 Jul 18 2014 etc  
drwxr-xr-x 3 user user 4096 Jul 18 2014 https  
drwxr-xr-x 6 user user 4096 Jul 18 2014 lib  
drwxr-xr-x 3 user user 4096 Jul 18 2014 libexec  
lrwxrwxrwx 1 user user 11 Feb 1 15:10 linuxrc -> bin/busybox  
drwxr-xr-x 3 user user 4096 Jul 18 2014 mnt  
drwxr-xr-x 2 user user 4096 Jul 18 2014 mydlink  
drwxr-xr-x 2 user user 4096 Jul 18 2014 proc  
drwxr-xr-x 2 user user 4096 Jul 18 2014 root  
drwxr-xr-x 2 user user 4096 Jul 18 2014 sbin  
drwxr-xr-x 6 user user 4096 Jul 18 2014 share  
drwxr-xr-x 2 user user 4096 Jul 18 2014 sys  
drwxr-xr-x 3 user user 4096 Jul 18 2014 tmp  
drwxr-xr-x 6 user user 4096 Jul 18 2014 usr  
lrwxrwxrwx 1 user user 6 Feb 1 15:10 var -> ./tmp/  
drwxr-xr-x 7 user user 12288 Jul 18 2014 www  
$

It appears as though the file system was extracted successfully.

##Step 4: QEMU user mode

First let’s use QEMU in user mode to try and emulate a single binary. Most embedded Linux devices use BusyBox to provide a command shell and the associated environment. BusyBox is a multi-call that creates symlinks from the file system to the BusyBox binary. The BusyBox applet selected depends on the argv[0] of the executed binary. We can see this in the extracted firmware:

$ ls -lF ./bin/ls  
lrwxrwxrwx 1 user user 7 Feb 1 15:10 ./bin/ls -> busybox*  
$  

##Step 5: Investigation

Let’s try to execute the /bin/ls command from the router (which really runs BusyBox). We can get more information about busybox with rabin2:

$ rabin2 -I ./bin/busybox  
arch mips  
binsz 430694  
bintype elf  
bits 32  
canary false  
class ELF32  
crypto false  
endian big  
havecode true  
intrp /lib/ld-uClibc.so.0  
lang c  
linenum false  
lsyms false  
machine MIPS R3000  
maxopsz 16  
minopsz 1  
nx false  
os linux  
pcalign 0  
pic false  
relocs false  
relro no  
rpath NONE  
static false  
stripped true  
subsys linux  
va true  

This shows us (among other details about the binary) that the architecture of the binary is MIPS, meaning the correct user mode emulator for QEMU is the MIPS emulator. It also tells us the binary is not statically linked. Let’s check what libraries it is linked against:

$ rabin2 -l ./bin/busybox  
[Linked libraries] libsutil.so  
libgcc_s.so.1  
libc.so.0  

3 libraries

##Step 6: Basic execution

Since this is a dynamically linked executable, it will be looking for the libraries it is linked against in the load library path. To make emulation easier, the most straightforward approach is to execute the binary inside a chroot. To do this we must use the statically linked QEMU MIPS emulator (qemu-mips-static). We copy this binary inside the chroot to make things easier.

The following commands will set up the chroot correctly:

$ cp /usr/bin/qemu-mips-static ./  
$ sudo chroot . ./qemu-mips-static ./bin/ls  
bin libexec qemu-mips-static tmp  
dev linuxrc root usr  
etc mnt sbin var  
https mydlink share www  
lib proc sys  
$  

Success! We are able to execute binaries. Let’s try to run /bin/sh:

$ sudo chroot . ./qemu-mips-static ./bin/sh

BusyBox v1.01 (2014.07.18-09:34+0000) Built-in shell (ash)  
Enter 'help' for a list of built-in commands.  
/ # ls  
./bin/sh: ls: not found  
/ #  

“Not found” seems odd. Since /bin/sh does the typical fork/execve pattern, when execve is called to run /bin/ls, it tries to use the system’s ELF interpreter to load the binary. Obviously this won’t work. Luckily, the Linux kernel has a module called binfmt that can be used to configure the kernel to use a wrapper program for executables based on a configurable “magic” signature.

##Step 7: Using binfmt for execution

Here’s a quick no frills configuration that will allow us to use binfmt to get the router’s /bin/sh shell working correctly. Note that we’re echoing the magic signature to /proc so these steps will need to be rerun if you reboot your system. Reading the official binfmt documentation is STRONGLY encouraged:

$ sudo modprobe binfmt_misc  
$ sudo mount binfmt_misc -t binfmt_misc /proc/sys/fs/binfmt_misc  
$ sudo -s  
$ echo ':mips:M::\x7fELF\x01\x02\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x08:\xff\xff\xff\xff\xff\xff\xff\x00\xff\xff\xff\xff\xff\xff\xff\xff\xff\xfe\xff\xff:/qemu:' > /proc/sys/fs/binfmt_misc/register  
$ exit  
$ cp ./qemu-mips-static ./qemu  
$  

Now we can re-execute /bin/sh in QEMU and it will work:

$ sudo chroot . ./qemu-mips-static ./bin/sh

BusyBox v1.01 (2014.07.18-09:34+0000) Built-in shell (ash)
Enter 'help' for a list of built-in commands.  
  
/ # ls  
bin libexec qemu sys  
dev linuxrc qemu-mips-static tmp  
etc mnt root usr  
https mydlink sbin var  
lib proc share www  
/ #  

Success! We can now correctly emulate individual binaries!

We hope you enjoyed the first post in our Embedded Linux Device Security Research series.

Emulating binaries from embedded Linux systems allows you to conduct vulnerability research tasks against the binaries, as well as aide in reverse engineering by using a debugger to gain more insight into what the binary is doing.

In our next post we’ll discuss how to use QEMU in system mode to emulate the entire OS.