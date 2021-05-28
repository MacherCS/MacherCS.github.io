# Resize the partition of disk under Ubuntu

If we cannot open the user interface of Ubuntu and we want to resize the partition of disk, what should we do?

* Firstly, press ctrl+alt+f1 to come to the tty mode ubuntu.

* Use the command 'df -h' to see the disk information of the disk. For example, like  
Filesystem Size Used Avail Use% Mounted on  
udev 3.9G 0 3.9G 0% /dev  
tmpfs 798M 1.1M 797M 1% /run  
/dev/vda2 49G 39G 8.0G 83% /  

Then use the command 'fdisk -l' to see check the partition information. For example, like

Disk /dev/vda: 120 GiB, 128849018880 bytes, 251658240 sectors  
Units: sectors of 1 * 512 = 512 bytes  
Sector size (logical/physical): 512 bytes / 512 bytes  
I/O size (minimum/optimal): 512 bytes / 512 bytes  
Disklabel type: gpt  
Disk identifier: 0A82F7CF-FB16-4A55-ACF6-5D4339FA7608

Device Start End Sectors Size Type  
/dev/vda1 2048 4095 2048 1M BIOS boot  
/dev/vda2 4096 104855551 104851456 50G Linux filesystem  
/dev/vda3 104855552 251658206 146802655 70G Linux filesystem  

* Now we choose the partition /dev/vda, input the command 'parted /dev/vda', for example

GNU Parted 3.2  
Using /dev/vda  
Welcome to GNU Parted! Type 'help' to view a list of commands.  
(parted) p  # 输入p  
Model: Virtio Block Device (virtblk)  
Disk /dev/vda: 129GB  
Sector size (logical/physical): 512B/512B  
Partition Table: gpt  
Disk Flags:  

Number Start End Size File system Name Flags  
1 1049kB 2097kB 1049kB bios_grub  
2 2097kB 53.7GB 53.7GB ext4  


* Input resizepart 2 and then input yes, and we fill the disk space mentioned above (Disk /dev/vda: 129GB) , and then input q(quit) to exit. For example,

(parted) resizepart 2  
Warning: Partition /dev/vda2 is being used. Are you sure you want to continue?  
Yes/No? yes  
End? [53.7GB]? 129GB  
(parted) q  
Information: You may need to update /etc/fstab.

* After we quit, we cannot see anything changed by inputting the command 'df -h'; but we will find the size of partition has been changed by using command 'lsblk'. Because only the block size changes and the file system has not been updated. 

And now we use 'resize2fs' command to update

root@localhost:~# resize2fs /dev/vda2  
resize2fs 1.44.1 (24-Mar-2018)  
Filesystem at /dev/vda2 is mounted on /; on-line resizing required  
old_desc_blocks = 7, new_desc_blocks = 15  
The filesystem on /dev/vda2 is now 31456763 (4k) blocks long.  

And then we can check with 'df -h'  

root@localhost:~# df -h  
Filesystem Size Used Avail Use% Mounted on  
udev 3.9G 0 3.9G 0% /dev  
tmpfs 798M 1.1M 797M 1% /run  
/dev/vda2 118G 39G 75G 35% /  

And check with lsblk  

root@localhost:~# lsblk  
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINT  
loop1 7:1 0 6.6M 1 loop /snap/libxslt/44  
loop2 7:2 0 91.3M 1 loop /snap/core/8592  
loop3 7:3 0 9.6M 1 loop /snap/libxslt/67  
loop4 7:4 0 91.4M 1 loop /snap/core/8689  
vda 252:0 0 120G 0 disk  
├─vda1 252:1 0 1M 0 part  
└─vda2 252:2 0 120G 0 part /  





## Attention