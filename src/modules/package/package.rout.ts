import { Router } from "express";
import { addPackageValidator, getPackageValidator } from "./package.validator";
import req_validator from "../../middleware/req_validation";
import { packageControler } from "./package.controller";
const router = Router();

router.post('/',
    addPackageValidator,
    req_validator(),
    packageControler.createPackage
)

router.get('/',
    getPackageValidator,
    req_validator(),
    packageControler.getPackages_by_type
)

export const packageRouts = router