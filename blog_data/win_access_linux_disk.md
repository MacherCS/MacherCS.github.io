# How to use windows to connect the disk of linux

* Firstly, open the WSL of windows.

* Open windows terminal with admin role

Then use the command 
'GET-CimInstance -query "SELECT * from Win32_DiskDrive"'
to see check the disk information. For example, like

    * PS C:\Users\scelt> GET-CimInstance -query "SELECT * from Win32_DiskDrive"

    * DeviceID           Caption              Partitions Size          Model
    * --------           -------              ---------- ----          -----
    * \\.\PHYSICALDRIVE1 Force MP600          4          1000202273280 Force MP600
    * \\.\PHYSICALDRIVE0 WDC WD80EFZX-68UW8N0 1          8001560609280 WDC WD80EFZX-68UW8N0

* Assume \\\\.\PHYSICALDRIVE0 is the disk.

We use 

    * wsl --mount \\\\.\PHYSICALDRIVE0 --bare

to mount the disk. This is for checking the type of disk.
Go to the WSL, and input 

    * lsblk

The output is like

    * NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
    * sda      8:0    0  256G  0 disk
    * sdb      8:16   0  256G  0 disk /
    * sdc      8:32   0  7.3T  0 disk
    * └─sdc1   8:33   0  7.3T  0 part

Assume sdc1 is the disk that we are going to mount.

We input 

    * sudo blkid /dev/sdc1

and obtain the disk type. For example,

    * /dev/sdc1: UUID="ce35a569-9e17-4a83-b468-9d14fea9983e" TYPE="ext4" PARTLABEL="part1" PARTUUID="bb1a9b80-27d9-4b32-8cd1-51f71cb48252"

Now we know this is a disk of ext4.

We go back to windows terminal, and then input 

    * wsl --unmount \\.\PHYSICALDRIVE0

to unmount the disk.

We use command

    * wsl --mount \\.\PHYSICALDRIVE0 --partition 1 --type ext4

to mount the disk to the '/mnt/wsl' folder of WSL.



## Attention
Never use windows disk manager to open linux disk.