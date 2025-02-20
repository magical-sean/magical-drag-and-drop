import { QMainWindow, QWidget, WidgetEventTypes, QDragMoveEvent, QDragLeaveEvent, QDropEvent, QMimeData, FlexLayout, QLabel, AlignmentFlag, QSize, QFont, QIcon, QSystemTrayIcon } from '@nodegui/nodegui';
import { exec } from 'node:child_process';
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as http from "node:http";
import * as fileType from 'file-type';

interface ActivePDF {
  fileName: string;
  id: string;
  localFilePath: string;
  path: string;
  url: string;
}

const APP_NAME = 'MagicalDragAndDrop';
const PDF_MIME_TYPE = 'application/pdf';
let address =  '';
let activePDF: ActivePDF | undefined = undefined;

function setActivePDF(args: ActivePDF) {
  console.log('>> Setting pdf args: ', args);

  activePDF = {
    ...args,
  };
}

function getActivePDFPathForId(id: string | null): string | undefined {
  if (!activePDF) {
    return undefined;
  }
  if (activePDF.id !== id) {
    return undefined;
  }
  return activePDF.localFilePath;
}

function startServer() {
  const hostname = 'localhost';
  const port = 8000;

  const server = http.createServer((req, res) => {
    const parsed = new URL(req?.url ?? '', address);
    const id = parsed.searchParams.get('id');
    const activePath = getActivePDFPathForId(id);

    if (!!activePath) {
      console.log('>>> ID: ', {id, activePath, activePDF});
      fs.readFile(activePath, async (err, content) => {
        
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
          } else {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 Internal Server Error</h1>');
          }
        } else {
          const type = await fileType.fileTypeFromBuffer(content);
          if (type?.mime !== PDF_MIME_TYPE) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>400 Invalid file</h1>');
          } else {
            res.writeHead(200, { 'Content-Type': PDF_MIME_TYPE });
            res.end(content);
          }
        }
      });
    } else if (id) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>400 Not Found</h1>');
    }
  });

  server.listen(port, hostname, () => {
    address = `http://${hostname}:${port}/`;
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

function openFileInBrowser(id: string, fileName: string) {
  if (!address) {
    return;
  }
  const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
  const cmd = `${start} ${address}${encodeURIComponent(fileName)}?id=${id}`;
  const child = exec(cmd);
  child.on('error', (err) => {
    console.error('>> Error: Open file in browser', err);
  });
  child.on('exit', (code) => {
    console.log(`>> Exit: Open file in browser ${code}`);
  });
  child.on('close', (code, signal) => {
    console.log(`>> Close: Open file in browser ${signal}`);
  });
}

function main(): void {
  startServer();
  const win = new QMainWindow();
  win.setWindowTitle(APP_NAME);

  const rootView = new QWidget();
  const rootLayout = new FlexLayout();
  rootView.setLayout(rootLayout);
  rootView.setObjectName("rootView");

  const label = new QLabel();
  label.setObjectName('label');
  label.setText('Drag & drop your PDF here to start');
  label.setWordWrap(true);
  label.setAlignment(AlignmentFlag.AlignCenter);

rootLayout.addWidget(label);

// Tell FlexLayout how you want children of rootView to be poisitioned
rootView.setStyleSheet(`
  #rootView{
    display: flex;
    align-items: 'center';
    justify-content: 'center';
    flex-direction: 'row';
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #F4F7FB;
  }
  #label {
    flex: 1;
    width: 100%;
    padding: 10px;
    color: #6C706F;
    background-color: transparent;
  }
`);

  
  rootView.setAcceptDrops(true);

  rootView.addEventListener(WidgetEventTypes.DragEnter, (e) => {
    if (!e) {
      return;
    }
    let ev = new QDragMoveEvent(e);
    let mimeData:QMimeData = ev.mimeData();
    const [url] = mimeData.urls(); 
    if (!url.isValid()) {
      ev.ignore();
    } else {
      ev.accept();
    }
    });

rootView.addEventListener(WidgetEventTypes.DragLeave, (e) => {
  if (!e) {
    return;
  }
    let ev = new QDragLeaveEvent(e);
    ev.ignore(); //Ignore the event when it leaves
});

rootView.addEventListener(WidgetEventTypes.Drop, (e) => {
  if (!e) {
    return;
  }
    const dropEvent = new QDropEvent(e);
    const mimeData = dropEvent.mimeData();
    
    const [url] = mimeData.urls();
    if (url) {
      const id = crypto.randomUUID();
      const fileName = url.fileName()
      setActivePDF({
        fileName,
        id,
        localFilePath: url.toLocalFile(),
        path: url.path(),
        url: url.toString(),
      })
      openFileInBrowser(id, fileName);
    }
});

  win.setCentralWidget(rootView);
  win.setMinimumSize(240, 170);
  win.setMaximumSize(600,400);

  const icon = new QIcon ('../assets/logox200.png');
  win.setWindowIcon(icon);
    
  win.setStyleSheet(`
    width: 100%;
    height: 100%;
    margin: 2px;
    `);
  win.show();

  (global as any).win = win;
}
main();
