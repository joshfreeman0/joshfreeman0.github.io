import subprocess,glob,os
for f in sorted(glob.glob('*.svg')):
    h=f'<html><body style="margin:0;background:transparent"><img src="file://{os.path.abspath(f)}" width=512 height=512></body></html>'
    open('/tmp/s.html','w').write(h)
    subprocess.run(['google-chrome','--headless','--no-sandbox','--disable-gpu','--hide-scrollbars','--default-background-color=00000000','--window-size=512,512',f'--screenshot={f[:-4]}.png','file:///tmp/s.html'],capture_output=True)
