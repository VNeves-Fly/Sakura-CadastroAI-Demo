# Legitimuz Documentation and Integration Guide - v2

## Solution and product quick guide

Our solution is composed of 4 main modules - LegitCheck, LegitId, , LegitDoc, LegitFace

Although you are free to use all of our solutions in any step or order you want, the general order we suggest to use them (to ensure a good conversion rates and security validations)

- Use LegitCheck basic queries on first step of user register flow so you can better qualify the lead based on regulatory or necessity of the flow
- Optionally, you can use other LegitCheck datasets to create user seamless flow, applying various steps of validations during their experience, or using the gathered data to autofill the onboarding forms and reduce friction
- From this point and onward, after already qualifying your user, you can proceed to gradually call our solution to add more layers of validations
- LegitFace and LegitId modules are golden now because you can validate a user using only biometrics, securing their identity before enabling more sensistive operations inside your business
- Last module, and a complement to reinforce all the validations, would be the LegitDoc. This module can capture the user document and perform a single facematch to guaranteee the property of the document. You can now even call a document verification process to ensure the document is authentic
- After all validations are set, you can start using the LegitFace module as a transactional tool, to validate important operations like a Pix Out or payment before starting the payment process, by example

As a passive monitoring tool, you can set any LegitCheck dataset to run again on any point of the user journey. By example, you can trigger it to check again the Processes dataset on every user transaction that exceeds X value (this logic is on your system side)

---
