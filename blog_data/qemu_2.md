# Emulating Embedded Linux Systems with QEMU

The source of the article is https://www.novetta.com/2018/02/emulating-embedded-linux-systems-with-qemu/ by Novetta.

This blog is the second post in our Embedded Linux Device Security Research series. In the first post, Emulating Embedded Linux Applications with QEMU, we covered some commonly used tools and discussed using QEMU in user-mode to emulate a single binary. This post covers how to use QEMU in system mode to create a VM to emulate the target device.

When emulating individual binaries doesn’t cut it, you can run QEMU in system mode to emulate an entire OS. From the previous post, we know that the D-Link DIR-866L is a MIPS device, so we will use the qemu-system-mips emulator. Note that in most cases, emulation is NOT a perfect solution as you might not have the same hardware the device is expecting to see, or might not even be running the same kernel inside the VM.

For those running Windows 10 with WSL, I recommend running the QEMU system emulator inside a Linux VM (using something like VMWare Player or VirtualBox). I’ve found that QEMU will have networking issues when running on WSL.

##Step 1: QEMU System Mode – Emulation Strategies

For QEMU in system mode, we need to provide the emulator with a file system image and a kernel or BIOS image to use in the boot process. The file system image is easy to get since we extracted the squashfs root previously with binwalk, and it is relatively easy to create an image from this that QEMU can use. The kernel is trickier. There are three main emulation strategies – each has its pros and cons:

* Extract the kernel from the device firmware, create a rootfs image using the extracted squashfs root, and then boot from that image. This emulates the device as closely as possible, but it can be challenging to extract the kernel from the firmware and get the device to boot correctly.
* Use a pre-compiled kernel for the correct architecture (MIPS in this case), create a rootfs image using the extracted squashfs root, and then boot from that image. This is a reasonably easy strategy, but it can be cumbersome to get the device to boot correctly.
* Use a pre-compiled kernel for the correct architecture (MIPS in this case), and use a pre-made file system image (e.g., a QCOW2 image) of the correct architecture (MIPS) to boot the VM. After the VM is booted, copy the contents of the squashfs root into the VM and create a chroot inside the squashfs root. This is the least accurate emulation method but is the easiest.

For this post, we will use emulation strategy number 3. Using a pre-compiled Debian MIPS kernel with a MIPS QCOW2 file system image, boot the VM, copy the DIR-866L’s extracted squashfs root into the VM, and then create a new chroot.

##Step 2: Networking

Before beginning VM setup, we want to consider what networking requirements are required for the VM. QEMU supports two basic networking modes: port redirection mode (e.g., redirect a port on the host OS into the guest VM) and bridged mode.

Port Redirection Mode

    * Ideal when you know what ports to connect to on the VM
    * Cannot be used to send arbitrary protocols and only supports TCP and UDP

Bridged Mode

    * Uses a bridge interface and TUN/TAP interfaces on the host OS to give the guest VM an interactive interface
    * Allows for arbitrary protocols
    * The most accurate representation of having a physical device but is more difficult to configure

For our example today, we will use port redirection mode. To learn more about bridged mode, explore Zachary Cutlip’s post – Running Debian MIPS Linux in QEMU.

For more information about general QEMU networking.

##Step 3: Getting a kernel and file system image

Because we are using a pre-compiled kernel and rootfs, we need to either build our own or find a pre-compiled one. There are pre-compiled Debian Linux MIPS kernels and QCOW2 rootfs file system images available online. The following commands will download the kernel and the QCOW2 image:

$ mkdir linux_mips; cd linux_mips  
$ wget https://people.debian.org/~aurel32/qemu/mips/vmlinux-3.2.0-4-4kc-malta  
$ wget https://people.debian.org/~aurel32/qemu/mips/debian_wheezy_mips_standard.qcow2  

##Step 4: Booting the VM

Now we have everything we need, let’s boot the VM:

$ qemu-system-mips -M malta -kernel vmlinux-3.2.0-4-4kc-malta -hda debian_wheezy_mips_standard.qcow2 -append "root=/dev/sda1" -nographic -redir tcp:2222::22

This will take several moments to start the VM. Once fully booted, you will be at a standard Linux tty login prompt. Login with the username “root” and the password “root”:

Debian GNU/Linux 7 debian-mips ttyS0

debian-mips login: root
Password:
Linux debian-mips 3.2.0-4-4kc-malta #1 Debian 3.2.51-1 mips

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
root@debian-mips:~#

We are now inside the VM. Next, copy the contents of the DIR-866L’s squashfs root into the VM.

##Step 5: Copying the squashfs root

Copying the squashfs root is pretty simple. First, ensure that the sshd is running inside the MIPS VM:

root@debian-mips:~# service ssh start; service ssh status  
Starting OpenBSD Secure Shell server: sshd.  
sshd is running.  
root@debian-mips:~#  

Now, back on the host OS, tar up the contents of the squashfs root and copy it into the guest VM:

$ tar zcf squashfs-root.tar.gz squashfs-root/  
$ scp -P 2222 ./squashfs-root.tar.gz root@127.0.0.1:/root  

At this point, it may be easier to SSH into the VM and work from there. The default QEMU console can be rather limiting (especially if using applications like vi and less which try to detect your terminal size):

$ ssh -p 2222 root@127.0.0.1

Now we can extract the tarball on the guest MIPS VM:

root@debian-mips:~# ls  
squashfs-root.tar.gz  
root@debian-mips:~# tar zxf squashfs-root.tar.gz  
root@debian-mips:~#  

As we discovered previously, the libraries we extracted from the DIR-866L are dynamically linked. The easiest way to force the linker to use the correct libraries is to start an instance of the bourne shell inside a chroot using the router’s filesystem:

root@debian-mips:~# cd squashfs-root/  
root@debian-mips:~/squashfs-root# chroot . ./bin/sh  

BusyBox v1.01 (2014.07.18-09:34+0000) Built-in shell (ash)  
Enter 'help' for a list of built-in commands.  

/ #

From here we have a fairly good approximation of the router’s environment and can begin to poke around a bit.
Step 6: Starting the device’s services

The last step in this process is to start the DIR-866L’s services. Most embedded Linux devices have startup scripts in /etc/init.d/ that will launch services and perform configuration. We can investigate this back on our host OS:

$ cd squashfs-root/etc  
$ ls -al init.d  
total 20  
drwxr-xr-x 2 user user 4096 Jul 18 2014 .  
drwxr-xr-x 15 user user 4096 Jul 18 2014 ..  
-rwxr-xr-x 1 user user 1640 Jul 18 2014 miniupnpd  
-rwxr-xr-x 1 user user 1733 Jul 18 2014 samba  
-rwxr-xr-x 1 user user 1824 Jul 18 2014 silex  
$  

No such luck here, there’s no obvious rcS file in that directory. Poking around /etc/ reveals that rcS is stored in /etc/rc.d/rcS:

$ ls -al rc.d  
total 32  
drwxr-xr-x 2 user user 4096 Jul 18 2014 .  
drwxr-xr-x 15 user user 4096 Jul 18 2014 ..  
-rwxr-xr-x 1 user user 368 Jul 18 2014 network  
-rwxr-xr-x 1 user user 532 Jul 18 2014 rc.bridge  
-rwxr-xr-x 1 user user 847 Jul 18 2014 rc.network  
-rwxr-xr-x 1 user user 2532 Jul 18 2014 rcS  
-rwxr-xr-x 1 user user 4143 Jul 18 2014 rc.wlan  
$  

I recommend ALWAYS reading the device’s startup scripts to figure out what they do before you run them. Let’s try to run the rcS script on the guest MIPS VM:

/ # /etc/rc.d/rcS  

This outputs a lot of debugging information. Wait 10 seconds or so for the services to fully start, then hit enter a few times to get back to your shell prompt.

Switching back to the QEMU console, we can use ps and netstat to see if any changes happened:

root@debian-mips:~# ps auxwww  
root@debian-mips:~# netstat -anp  

Unfortunately, no services appeared to have started. Examining the contents of /etc/rc.d/rcS show that it runs the command “rc init &”. Let’s try to run that manually and see what happens:

/ # rc init &  

Once again we receive debug output. This time we see lines like:  

/dev/nvram: No such file or directory  
/dev/nvram: No such file or directory  
nvram_sanity_check: restore key: graph_enable="none"  
/dev/nvram: No such file or directory  
/dev/nvram: No such file or directory  
nvram_sanity_check: restore key: user_password=""  
/dev/nvram: No such file or directory  
/dev/nvram: No such file or directory  
nvram_sanity_check: restore key: user_username="user"  
/dev/nvram: No such file or directory  
/dev/nvram: No such file or directory  
nvram_sanity_check: restore key: admin_password=""  
/dev/nvram: No such file or directory  
/dev/nvram: No such file or directory  
nvram_sanity_check: restore key: admin_username="admin"  
/dev/nvram: No such file or directory  

These indicate that the device is looking to read initial configuration settings from NVRAM. Zachary Cutlip has a useful utility called nvram-faker that we can use to fake NVRAM by setting the LD_PRELOAD environment variable correctly. The utility is available online at https://github.com/zcutlip/nvram-faker. At this point, we could cross-compile nvram-faker for MIPS and configure it to correct these errors, but for now, let’s ignore the errors.

Let’s use the QEMU console to check if anything was started:

root@debian-mips:~# ps auxwww  
[SNIP] root 2528 98.3 0.4 1792 572 pts/0 R 17:16 5:52 rc init  
root 2669 0.0 0.1 1148 228 pts/0 S 17:16 0:00 lighttpd-angel -D -f /etc/  lighttpd.conf  
root 2670 0.1 0.9 4444 1212 pts/0 S 17:16 0:00 /sbin/lighttpd -D -f /etc/  lighttpd.conf  
[SNIP] root@debian-mips:~#  

It looks like some processes were started. Let’s check netstat:

root@debian-mips:~# netstat -anp  
Active Internet connections (servers and established)  
Proto Recv-Q Send-Q Local Address Foreign Address State PID/Program name  
tcp 0 0 127.0.0.1:25 0.0.0.0:* LISTEN 2239/exim4  
tcp 0 0 0.0.0.0:41081 0.0.0.0:* LISTEN 1584/rpc.statd  
tcp 0 0 0.0.0.0:111 0.0.0.0:* LISTEN 1541/rpcbind  
tcp 0 0 0.0.0.0:22 0.0.0.0:* LISTEN 2017/sshd  
tcp 0 0 10.0.2.15:22 10.0.2.2:59762 ESTABLISHED 2340/0  
tcp6 0 0 ::1:25 :::* LISTEN 2239/exim4  
tcp6 0 0 :::46437 :::* LISTEN 1584/rpc.statd  
tcp6 0 0 :::111 :::* LISTEN 1541/rpcbind  
tcp6 0 0 :::80 :::* LISTEN 2670/lighttpd  
tcp6 0 0 :::22 :::* LISTEN 2017/sshd  
udp 0 0 0.0.0.0:864 0.0.0.0:* 1541/rpcbind  
udp 0 0 0.0.0.0:111 0.0.0.0:* 1541/rpcbind  
udp 0 0 127.0.0.1:912 0.0.0.0:* 1584/rpc.statd  
udp 0 0 0.0.0.0:32956 0.0.0.0:* 1584/rpc.statd  
udp 0 0 0.0.0.0:40241 0.0.0.0:* 1538/dhclient  
udp 0 0 0.0.0.0:68 0.0.0.0:* 1538/dhclient  
udp6 0 0 :::864 :::* 1541/rpcbind  
udp6 0 0 :::111 :::* 1541/rpcbind  
udp6 0 0 :::54675 :::* 1538/dhclient  
udp6 0 0 :::47183 :::* 1584/rpc.statd  
[SNIP]  

It looks like some sockets were created too. Let’s try to use telnet to query the HTTP server:  

root@debian-mips:~# telnet 127.0.0.1 80  
Trying 127.0.0.1...  
Connected to 127.0.0.1.  
Escape character is '^]'.  
GET / HTTP/1.1  
Host: 127.0.0.1  

HTTP/1.1 200 OK  
Expires: Fri, 18 Jul 2014 17:34:02 GMT  
Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=-1  
Content-Length: 0  
Date: Fri, 18 Jul 2014 17:34:02 GMT  
Server: lighttpd/1.4.28-devel-12561  

^] telnet> c  
Connection closed.  
root@debian-mips:~#  

The server returned the headers but did not send any content back. Maybe if we fixed the NVRAM errors, we could get content back, but that will be discussed in the next post in our series.  

In this post, we covered using QEMU in system mode to create a VM to emulate the D-Link DIR-866L. We were successfully able to start the web server. In the next post, we will fix the errors with the NVRAM, and begin to fuzz the D-Link DIR-866L’s web server for vulnerabilities.

Additional posts in the Embedded Linux Device Security Research series:
1) Emulating Embedded Linux Applications with QEMU
