const fs = require('fs').promises;
const path = require('path');

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const link = await fs.readlink(srcPath);
      try { await fs.symlink(link, destPath); } catch { /* ignore */ }
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function removeDir(dir) {
  if (!(await exists(dir))) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await removeDir(full);
    } else {
      await fs.unlink(full);
    }
  }
  try { await fs.rmdir(dir); } catch (e) { /* ignore */ }
}

(async () => {
  const projectRoot = path.resolve(__dirname, '..');
  const distDir = path.join(projectRoot, 'dist');
  const backendPublic = path.resolve(projectRoot, '..', 'backend', 'public');

  if (!(await exists(distDir))) {
    console.error('dist folder not found. Run `npm run build` first.');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(projectRoot, '..', 'backend', `public_backup_${timestamp}`);

  try {
    if (await exists(backendPublic)) {
      console.log('Creating backup of existing backend/public ->', backupDir);
      await copyDir(backendPublic, backupDir);
    } else {
      console.log('backend/public does not exist, will create it.');
    }

    // empty backendPublic
    if (await exists(backendPublic)) {
      console.log('Clearing existing backend/public');
      // remove files and subdirs but keep the folder
      const entries = await fs.readdir(backendPublic, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(backendPublic, entry.name);
        if (entry.isDirectory()) {
          await removeDir(full);
        } else {
          await fs.unlink(full);
        }
      }
    } else {
      await fs.mkdir(backendPublic, { recursive: true });
    }

    console.log('Copying dist -> backend/public');
    await copyDir(distDir, backendPublic);

    console.log('Deploy complete. Backup saved at:', backupDir);
  } catch (err) {
    console.error('Deploy failed:', err);
    process.exit(1);
  }
})();
