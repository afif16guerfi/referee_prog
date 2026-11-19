import sys
from PIL import Image, ImageChops
n=sys.argv[1]
a=Image.open(f'{n}_dom.png').convert('L');b=Image.open(f'{n}_cv.png').convert('L')
H=min(a.height,b.height);rows=40;bad=0
total=H//rows
for i in range(total+ (1 if H%rows>30 else 0)):
    y0=i*rows;y1=min(H,y0+(80 if i==16 else rows))
    best=10**9
    for dy in range(-4,5):
        for dx in range(-2,3):
            A=a.crop((6,y0,694,y1));B=b.crop((6+dx,max(0,y0+dy),694+dx,max(0,y0+dy)+(y1-y0)))
            d=ImageChops.difference(A,B).point(lambda v:255 if v>110 else 0)
            best=min(best,sum(d.histogram()[255:]))
    ok=best<60; bad+=0 if ok else 1
    print(f'case {i+1:2d}: min_diff_px={best:4d} {"OK" if ok else "MISMATCH"}')
    
print(n,'mismatches:',bad)
