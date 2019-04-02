# MDoc
Is a single page markdown explorer (see [example](sample/index.html)), inspired by the no longer maintained [MDwiki](http://dynalon.github.io/mdwiki/#!index.md)


## How to use

1. Copy the `index.html` from the [dist folder](dist/index.html) to the root of your Markdown folder
2. (Optional) Create and configure a `settings.json` file (see [sample/settings.json]())
3. (Optional) For File-tree and Search functionality - Run the [sample/Create-ContentJson.ps1]() file during your build process this creates a `content.json` file and place this in the Markdown folder root.


## no jQuery
Try not using jQuery and code VanillaJS, see [Sans jQuery](https://gist.github.com/joyrexus/7307312)


### Task list
- Add fullscreen functionality for elements (like tables, images etc)
- Write documentation about this repo (see [template](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2))


### Task list done
- Add npm run command to make development easy (eg watch files and transpile?!) 
- Add warning for <= IE11 when rendering Mermaid
- Page not found/error handling
- Page loading between pages
- Table striped styling
- Fullscreen viewing (mermaid)
- Table Of Contents links
- Make the top nav sticky (or create different navigation)
- Support Bootswatch themes
- Add Git edit and history links
- Integrate PlantUML
- Create build for one html file
- Transpile inline js
- Add print style sheet
