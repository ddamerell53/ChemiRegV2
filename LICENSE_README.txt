**ChemiReg CC0 Explanation**

Please note that all ChemiReg source code is licensed under the CC0 (see LICENSE) which basically means you can do whatever
you want with it, without attribution or restriction for free or commerial use (again refer to LICENSE).

HOWEVER (READ THIS!!!!!)

When you distribute to users one of the ChemiReg packages you are distributing the combined work (which includes many 
third-party libraries) these packages are licensed under the GPL.  This is because the 2D structure drawing tool we use 
in ChemiReg is called Ketcher which is licensed under the GPL.  In src/public/static/chemireg/theme/index.js you can trivially
switch to a different 2D drawing tool my modifying the methods import_from_string, get_mol_file, create_structure_editor.
If you modify these methods and don't distribute the Ketcher 2D drawing tool you can of course switch to whatever license
is compatible with the 2D drawing tool you have switched to.

Note that without Ketcher the ChemiReg packages fall under the Apache license because of the dependency upon js-xlsx.  
However the Apache license is compatible with both free and commerial use (withholding source code from end-users)

Basically ChemiReg is as free as we can make it and if you can replace the 2D drawing tool you are pretty much free
to create deriviates and withhold the source code from your users.   

BUT

We aren't laywers and so you should seek legal advice rather than trusting any of the above.

**public/static/chemireg/theme/**
For the convenience of the ChemiReg developers all third-party JavaScript libraries required on the front-end are stored within 
this directory. Each library has it's own directory and the corresponding license is within that directory.

These libraries ARE NOT LICENSED UNDER THE C00
