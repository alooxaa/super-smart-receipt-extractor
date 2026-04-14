# Workflow
### EN
Let's make different branches and then merge to main

Here's quickstart:
```
git clone https or ssh # you decide
git checkout -b my-branch # change my-branch to your branch name
git push -u origin my-branch # change my-branch to your branch name
```
then work as usual with git and push to that new branch
```
git add .
git commit -m "your commit text"
git push origin my-branch
```
Also let's keep our commit text clear like:
- Init project
- Add new feature
- Fix bug

### RU
Давайте работать в разных ветках и потом сольем все в одну

Быстрый старт:
```
git clone https or ssh # сами выбирайте
git checkout -b my-branch # поменяйте my-branch на название вашей ветки
git push -u origin my-branch # поменяйте my-branch на название вашей ветки
```
дальше работаете как обычно с гитом и пушите изменения в ту новую ветку
```
git add .
git commit -m "your commit text"
git push origin my-branch
```
Также давайте писать понятно что вы сделали в коммите, желательно на английском так:
- Init project
- Add new feature
- Fix bug

## Example of branch naming / Примеры названий веток:
- `cv-model` - for computer vision part
- `backend` - for api part
- `frontend` - for web + mobile part
