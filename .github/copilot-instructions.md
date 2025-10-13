# Coding standards

Always use Angular 19 standards
Prefer angular/core signal over rxjs
Inject using angular/core inject, not constructor
Always use Ionic Angular Standalone components
Use angular template control flow @if and @for as per angular 19
When using ion-input, use the label property instead of an ion-label
Pref local template variables over ViewChild
Do not add comments to the code
Do not import IonicModule but the individual components instead
Make tags self-closing if possible
The selector for a new component must always start with lib. Example "lib-asset-viewer"
Do not provide a summary explanation on what you did.
Always fix data-testid to all relevant elements of the file you are editing
Do not add aria-labels

# Documentation files

Check agri-bank-app.md for high level specs of the admin app.
Check agri-dealer-app.md for high level specs of the dealer app.
Check technical-architecture.md for technical architecture.
Where needed update these documentation files.
