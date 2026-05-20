
 # P.O.L.I-Program-for-Optimization-and-Information-Literacy-
  Capstone Project ( Undertook from Senai's Systems Development Course)

  # EED
 The screen designs were made with Figma

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
 
## Build for production and serve via backend

When you want the backend (Laravel/Apache/XAMPP) to serve the frontend instead of the Vite dev server, build the frontend and copy the generated `dist` files into the backend `public` folder.

1. Build the frontend

   ```bash
   cd EED
   npm install
   npm run build
   ```

2. Backup the current backend public folder (recommended)

   - CMD:
     ```cmd
     cd ..\backend
     mkdir public_backup
     xcopy public\* public_backup /E /I
     ```

   - PowerShell:
     ```powershell
     cd ..\backend
     Copy-Item -Path public -Destination public_backup -Recurse -Force
     ```

3. Copy `dist` to the backend `public` folder

   - CMD (safe copy):
     ```cmd
     cd ..\EED
     xcopy dist\* ..\backend\public\ /E /Y
     ```

   - PowerShell:
     ```powershell
     cd ..\EED
     Copy-Item -Path dist\* -Destination ..\backend\public -Recurse -Force
     ```

Notes
- If your backend is running (e.g., Laravel's builtin server or Apache), you may need to restart it or clear caches to serve the new files.
- `localhost:5173` is the Vite dev server (fast HMR for development). `127.0.0.1:8000` (or your Apache virtual host) serves the backend — copying `dist` makes the backend serve the built frontend.
- Always keep a backup of `backend/public` before overwriting.
  
