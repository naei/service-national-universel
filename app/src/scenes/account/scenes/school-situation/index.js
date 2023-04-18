import React from "react";
import { useSelector } from "react-redux";
import Input from "../../../../components/forms/inputs/Input";
import Select from "../../../../components/forms/inputs/Select";
import { getSchoolGradesOptions, getYoungSchooledSituationOptions } from "../../../../utils/school-situation.utils";
import SectionTitle from "../../components/SectionTitle";
import FormDescription from "../../components/FormDescription";

const AccountSchoolSituationPage = () => {
  const young = useSelector((state) => state.Auth.young);

  const values = {
    situation: young.situation || "",
    grade: young.grade || "",
    schoolName: young.schoolName || "",
    schoolCity: young.schoolCity || "",
  };

  return (
    <div className="bg-white shadow-sm mb-6 lg:rounded-lg">
      <form>
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="hidden lg:block lg:col-start-1 py-6 pl-6">
            <h2 className="text-gray-900 text-lg leading-6 font-medium m-0 mb-1">Situation scolaire</h2>
            <FormDescription>Ma situation scolaire au moment de mon inscription.</FormDescription>
          </div>
          <div className="px-4 pt-6 pb-2 lg:col-start-2 lg:col-span-2">
            <SectionTitle>Scolarité</SectionTitle>
            <FormDescription className="lg:hidden">Ma situation scolaire au moment de mon inscription.</FormDescription>
            <Select label="Statut" value={values.situation} disabled>
              {getYoungSchooledSituationOptions().map(({ label, value }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select label="Niveau de scolarité" value={values.grade} disabled>
              {getSchoolGradesOptions().map(({ label, value }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input label="Nom de l'établissement" value={values.schoolName} disabled />
            <Input label="Commune de l'établissement" value={values.schoolCity} disabled />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AccountSchoolSituationPage;
