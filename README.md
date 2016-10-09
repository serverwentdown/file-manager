
# file-manager

A basic node.js file manager. 

## Features

- [x] Directory browsing
  - [x] Filesize
  - [ ] Permissions
  - [ ] Owner
- [x] Folder creation
- [x] File uploads
  - [ ] Bulk file uploads
- [ ] File/folder renaming
- [x] Bulk file/folder selection
  - [x] Delete
  - [x] Download archive
  - [ ] Change permissions

## Usage

```zsh
git clone https://github.com/ambrosechua/file-manager.git ~/path/to/file-manager
node ~/path/to/file-manager/index.js
# or
npm i -g https://github.com/ambrosechua/file-manager.git
file-manager
```

## Options

Options are currently only suppliable via ENV variables. 

### PORT=<port>

Listen on <port>

### KEY=<key>

Setting this variable enables authentication using 
TOTP (RFC6238). <key> is a base32 encoded shared 
secret. This key is only a weak means of protection 
as it is succeptable to brute-force. You can generate 
one from [here](http://www.xanxys.net/totp/) or manually. 
