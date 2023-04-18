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
import IdCardReader from "./components/IdCardReader";
import SectionTitle from "../../components/SectionTitle";
import Withdrawal from "./components/Withdrawal";
import FormRow from "../../../../components/forms/layout/FormRow";
import { useForm } from "react-hook-form";

const AccountGeneralPage = () => {
  const young = useSelector((state) => state.Auth.young);
  const dispatch = useDispatch();

  const {
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
    getValues,
    register,
    control,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
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
    <>
      <div className="bg-white shadow-sm lg:rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(handleSubmitGeneralForm)}>
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="hidden lg:block lg:col-start-1 py-6 pl-6">
              <h2 className="text-gray-900 text-lg leading-6 font-medium m-0">Informations générales</h2>
            </div>
            <div className="px-4 py-6 lg:col-start-2 lg:col-span-2">
              <section className="mb-4">
                <SectionTitle>Identité et contact</SectionTitle>
                <FormRow>
                  <Input label="Nom" placeholder="Dupond" className="basis-1/2" disabled {...register("fistName")} />
                  <Input label="Prénom" placeholder="Gaspard" className="basis-1/2" {...register("lastName")} disabled />
                </FormRow>
                <Select label="Sexe" {...register("gender")}>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                </Select>
                <Input label="Date de naissance" placeholder="JJ/MM/AAAA" {...register("birthdateAt")} disabled />
                <Input
                  type="email"
                  label="Adresse email"
                  error={errors?.email?.message}
                  placeholder="example@example.com"
                  {...register("email", {
                    validate: validateEmail,
                  })}
                />
                <InputPhone
                  label="Téléphone"
                  name="phone"
                  error={errors?.phone?.message}
                  control={control}
                  placeholder={PHONE_ZONES[getValues().phone.phoneZone].example}
                  rules={{ validate: validatePhoneNumber }}
                />
              </section>
              <section className="mb-4">
                <SectionTitle>Adresse</SectionTitle>
                <Input label="Adresse" {...register("address")} disabled />
                <FormRow>
                  <Input label="Code Postal" {...register("zip")} className="basis-1/2" disabled />
                  <Input label="Ville" {...register("city")} className="basis-1/2" disabled />
                </FormRow>
              </section>
              <section>
                <SectionTitle>Pièce d&apos;identité</SectionTitle>
                <div className="flex flex-col gap-2">
                  {young.files.cniFiles && young.files.cniFiles.map((cniFile) => <IdCardReader key={cniFile._id} cniFile={cniFile} young={young} />)}
                </div>
              </section>
            </div>
          </div>

          <div className="bg-gray-50 py-3 px-4 flex flex-col lg:flex-row lg:justify-end gap-3">
            <ButtonLinkLight className="w-full lg:w-fit" to="/account">
              Annuler
            </ButtonLinkLight>
            <ButtonPrimary type="submit" className="w-full lg:w-fit" disabled={isSubmitting || !isValid}>
              {isSubmitting && <BiLoaderAlt className="animate-spin" />}
              Enregistrer
            </ButtonPrimary>
          </div>
        </form>
      </div>
      <div className="flex flex-col lg:flex-row items-center gap-6 py-8">
        {youngCanChangeSession(young) ? (
          <Link to="/changer-de-sejour" className="flex gap-2 items-center text-blue-600 text-sm">
            Changer de séjour
          </Link>
        ) : null}
        <Withdrawal young={young} />
      </div>
    </>
  );
};

export default AccountGeneralPage;
