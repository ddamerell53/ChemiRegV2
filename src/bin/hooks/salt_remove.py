from rdkit import Chem
def StripMol(mol, salt, dontRemoveEverything=False):
    def _applyPattern(m, salt, notEverything):
      nAts = m.GetNumAtoms()
      if not nAts:
        return m
      res = m

      t = Chem.DeleteSubstructs(res, salt, True)
      if not t or (notEverything and t.GetNumAtoms() == 0):
        return res
      else:
        res = t
      while res.GetNumAtoms() and nAts > res.GetNumAtoms():
        nAts = res.GetNumAtoms()
        t = Chem.DeleteSubstructs(res, salt, True)
        if notEverything and t.GetNumAtoms() == 0:
          break
        else:
          res = t
      return res

    if dontRemoveEverything and len(Chem.GetMolFrags(mol)) <= 1:
      return mol
    modified = False
    natoms = mol.GetNumAtoms()
    
    mol = _applyPattern(mol, salt, dontRemoveEverything)
    if natoms != mol.GetNumAtoms():
    	natoms = mol.GetNumAtoms()
    	modified = True
    if modified and mol.GetNumAtoms() > 0:
      Chem.SanitizeMol(mol)
    return mol
