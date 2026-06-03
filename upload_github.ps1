git init
git add .
git commit -m "Update"
git branch -M main
git remote remove origin
git remote add origin https://github.com/Kenneylin75/taxcoad.git
git remote -v
git push -u origin main --force
