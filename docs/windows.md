# Install scoop package manager
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install git
scoop install git

# Install nvm (NodeJS & NPM)
scoop install main/nvm
nvm install node
nvm use latest

# Install cmake
scoop install main/cmake

# Install gcc
scoop install main/gcc

# Install zip
scoop install main/zip

# Install NSIS
scoop bucket add extras
scoop install extras/nsis

# Install vscode (optional)
scoop install extras/vscode

# Add which alias
Set-Content $profile -Value ""
echo "Set-Alias which gcm" >> $profile && . $profile

# Need to manually install Visual Studio Community Edition - Desktop Development C++




https://stackoverflow.com/questions/40504552/how-to-install-visual-c-build-tools	
winget install Microsoft.VisualStudio.2022.BuildTools --force --override "--wait --passive --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows11SDK.22621"


