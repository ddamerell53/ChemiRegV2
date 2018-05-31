ALTER TABLE SGC.CHEMIREG_TRANSACTION
 DROP PRIMARY KEY CASCADE;

DROP TABLE SGC.CHEMIREG_TRANSACTION CASCADE CONSTRAINTS;

CREATE TABLE SGC.CHEMIREG_TRANSACTION
(
  PKEY           INTEGER,
  TRANSACTIONID  INTEGER                        NOT NULL
);


CREATE UNIQUE INDEX SGC.CHEMIREG_TRANSACTION_PK ON SGC.CHEMIREG_TRANSACTION
(PKEY);

CREATE OR REPLACE TRIGGER SGC.CHEMIREG_TRANSACTION_TRG
BEFORE INSERT
ON SGC.CHEMIREG_TRANSACTION
REFERENCING NEW AS New OLD AS Old
FOR EACH ROW
BEGIN
-- For Toad:  Highlight column PKEY
  :new.PKEY := CHEMIREG_TRANSACTION_SEQ.nextval;
END CHEMIREG_TRANSACTION_TRG;
/


ALTER TABLE SGC.CHEMIREG_TRANSACTION ADD (
  CONSTRAINT CHEMIREG_TRANSACTION_PK
  PRIMARY KEY
  (PKEY)
  USING INDEX SGC.CHEMIREG_TRANSACTION_PK
  ENABLE VALIDATE);

Insert into SGC.CHEMIREG_TRANSACTION
   (PKEY, TRANSACTIONID)
 Values
   (1, 10);
COMMIT;
