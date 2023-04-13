import React from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { Link } from "react-router-dom";
import { toastr } from "react-redux-toastr";
import { youngCanChangeSession } from "snu-lib";
import { PHONE_ZONES, PHONE_ZONES_NAMES } from "snu-lib/phone-number";
import { useDispatch, useSelector } from "react-redux";
import { setYoung } from "../../../../redux/auth/actions";
import { validateEmail, validatePhoneNumber } from "../../../../utils/form-validation.utils";
import { updateYoung } from "../../../../services/young.service";
import Input from "../../../../components/forms/inputs/Input";
import Select from "../../../../components/forms/inputs/Select";
import InputPhone from "../../../../components/forms/inputs/InputPhone";
import ButtonLinkLight from "../../../../components/ui/buttons/ButtonLinkLight";
import ButtonPrimary from "../../../../components/ui/buttons/ButtonPrimary";
import useForm from "../../../../hooks/useForm";
import IdCardReader from "./components/IdCardReader";
import SectionTitle from "../components/SectionTitle";
import Withdrawal from "./components/Withdrawal";

const AccountGeneralPage = () => {
  const young = useSelector((state) => state.Auth.young);
  const dispatch = useDispatch();

  const { values, setValues, validate, errors, handleSubmit, isSubmitionPending, isValid } = useForm({
    initialValues: {
      lastName: young.lastName || "",
      firstName: young.firstName || "",
      gender: young.gender || "male",
      birthdateAt: (young.birthdateAt && new Date(young.birthdateAt).toLocaleDateString("fr-fr")) || "",
      email: young.email || "",
      phone: {
        phoneNumber: young.phone || "",
        phoneZone: young.phoneZone || PHONE_ZONES_NAMES.FRANCE,
      },
      address: young.address || "",
      zip: young.zip || "",
      city: young.city || "",
    },
    validateOnChange: true,
    validateOnInit: true,
  });

  const handleSubmitGeneralForm = async (values) => {
    try {
      const youngDataToUpdate = {
        ...values,
        phone: values.phone.phoneNumber.trim(),
        phoneZone: values.phone.phoneZone,
        email: values.email.trim(),
      };
      const { title, message, data: updatedYoung } = await updateYoung({ _id: young._id, ...youngDataToUpdate });
      toastr.success(title, message);
      dispatch(setYoung(updatedYoung));
    } catch (error) {
      const { title, message } = error;
      toastr.error(title, message);
    }
  };

  return (
    <div className="bg-white shadow-sm mb-6">
      <form onSubmit={handleSubmit(handleSubmitGeneralForm)}>
        <div className="px-4 py-6">
          <section className="mb-4">
            <SectionTitle>Identité et contact</SectionTitle>
            <Input label="Nom" name="lastName" placeholder="Dupond" value={values.firstName} disabled />
            <Input label="Prénom" name="firstName" placeholder="Gaspard" value={values.lastName} disabled />
            <Select label="Sexe" name="gender" value={values.gender} onChange={setValues("gender")}>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
            </Select>
            <Input label="Date de naissance" name="birthdateAt" placeholder="JJ/MM/AAAA" value={values.birthdateAt} disabled />
            <Input
              type="email"
              label="Adresse email"
              name="email"
              error={errors.email}
              placeholder="example@example.com"
              value={values.email}
              onChange={setValues("email")}
              validate={validate(validateEmail)}
            />
            <InputPhone
              label="Téléphone"
              name="phone"
              value={values.phone}
              error={errors.phone}
              onChange={setValues("phone")}
              placeholder={PHONE_ZONES[values.phone.phoneZone].example}
              validate={validate(validatePhoneNumber)}
            />
          </section>
          <section className="mb-4">
            <SectionTitle>Adresse</SectionTitle>
            <Input label="Adresse" name="address" value={values.address} onChange={setValues("address")} disabled />
            <Input label="Code Postal" name="zip" value={values.zip} onChange={setValues("zip")} disabled />
            <Input label="Ville" name="city" value={values.city} onChange={setValues("city")} disabled />
          </section>
          <section>
            <SectionTitle>Pièce d&apos;identité</SectionTitle>
            <div className="flex flex-col gap-2">
              {young.files.cniFiles && young.files.cniFiles.map((cniFile) => <IdCardReader key={cniFile._id} cniFile={cniFile} young={young} />)}
            </div>
          </section>
        </div>
        <div className="bg-gray-50 py-3 px-4 flex flex-col gap-3">
          <ButtonLinkLight className="w-full" to="/account">
            Annuler
          </ButtonLinkLight>
          <ButtonPrimary type="submit" className="w-full" disabled={isSubmitionPending || !isValid}>
            {isSubmitionPending && <BiLoaderAlt className="animate-spin" />}
            Enregistrer
          </ButtonPrimary>
        </div>
      </form>
      <div className="flex flex-col items-center gap-6 py-8">
        {youngCanChangeSession(young) ? (
          <Link to="/changer-de-sejour" className="flex gap-2 items-center text-blue-600 text-sm">
            Changer de séjour
          </Link>
        ) : null}
        <Withdrawal young={young} />
      </div>
    </div>
  );
};

export default AccountGeneralPage;
