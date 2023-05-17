import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { Fragment, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import { Listbox, Transition } from "@headlessui/react";
import { AiOutlinePlus } from "react-icons/ai";
import { BsDownload } from "react-icons/bs";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi";
import { getDepartmentNumber, translateCniExpired } from "snu-lib";
import Badge from "../../components/Badge";
import Breadcrumbs from "../../components/Breadcrumbs";
import { ExportComponent, Filters, ResultTable, Save, SelectedFilters, SortOption } from "../../components/filters-system-v2";
import { orderCohort } from "../../components/filters-system-v2/components/filters/utils";
import SelectStatus from "../../components/selectStatus";
import { appURL } from "../../config";
import api from "../../services/api";
import plausibleEvent from "../../services/plausible";
import { ROLES, YOUNG_STATUS, formatStringLongDate, translate, translateInscriptionStatus } from "../../utils";
import { Title } from "../pointDeRassemblement/components/common";
import { transformInscription, transformVolontairesSchool } from "../volontaires/utils";
import DeletedInscriptionPanel from "./deletedPanel";
import Panel from "./panel";

export default function Inscription() {
  useDocumentTitle("Inscriptions");
  const user = useSelector((state) => state.Auth.user);
  const [young, setYoung] = useState(null);

  //List state
  const [data, setData] = useState([]);
  const pageId = "inscription-list";
  const [selectedFilters, setSelectedFilters] = useState({});
  const [paramData, setParamData] = useState({
    page: 0,
    sort: { label: "Nom (A > Z)", field: "lastName.keyword", order: "asc" },
  });
  //parentAllowSNU
  const filterArray = [
    { title: "Cohorte", name: "cohort", parentGroup: "Général", missingLabel: "Non renseigné", translate: translate, sort: orderCohort },
    { title: "Autorisation de participation", name: "parentAllowSNU", parentGroup: "Général", missingLabel: "Non renseigné", translate: translate },
    { title: "Statut", name: "status", parentGroup: "Général", missingLabel: "Non renseigné", translate: translateInscriptionStatus },
    { title: "Pays de résidence", name: "country", parentGroup: "Général", missingLabel: "Non renseigné", translate: translate },
    { title: "Académie", name: "academy", parentGroup: "Général", missingLabel: "Non renseigné", translate: translate },
    {
      title: "Région",
      name: "region",
      parentGroup: "Général",
      missingLabel: "Non renseigné",
      defaultValue: user.role === ROLES.REFERENT_REGION ? [user.region] : [],
      translate: translate,
    },
    {
      title: "Département",
      name: "department",
      parentGroup: "Général",
      missingLabel: "Non renseigné",
      defaultValue: user.role === ROLES.REFERENT_DEPARTMENT ? user.department : [],
      translate: (e) => getDepartmentNumber(e) + " - " + e,
    },
    {
      title: "Note interne",
      name: "hasNotes",
      parentGroup: "Général",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Classe",
      name: "grade",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    user.role === ROLES.REFERENT_DEPARTMENT
      ? {
          title: "Etablissement",
          name: "schoolName",
          parentGroup: "Dossier",
          missingLabel: "Non renseigné",
          translate: translate,
        }
      : null,

    {
      title: "Situation",
      name: "situation",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Sexe",
      name: "gender",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },

    {
      title: "Bénéficiaire PPS",
      name: "ppsBeneficiary",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Bénéficiaire PAI",
      name: "paiBeneficiary",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },

    {
      title: "Région rurale",
      name: "isRegionRural",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },

    {
      title: "Handicap",
      name: "handicap",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Aménagement spécifique",
      name: "specificAmenagment",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Accès mobilité réduite",
      name: "reducedMobilityAccess",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Affectation dans son département",
      name: "handicapInSameDepartment",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Allergies",
      name: "allergies",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translate,
    },
    {
      title: "Pièce d'identité périmée",
      name: "CNIFileNotValidOnStart",
      parentGroup: "Dossier",
      missingLabel: "Non renseigné",
      translate: translateCniExpired,
    },
  ].filter(Boolean);

  return (
    <>
      <Breadcrumbs items={[{ label: "Inscriptions" }]} />
      <div className="flex w-full flex-col px-8">
        <div className="flex items-center justify-between py-8">
          <Title>Inscriptions</Title>
          <div className="flex items-center gap-2">
            <Link
              to="/volontaire/create"
              onClick={() => plausibleEvent("Inscriptions/CTA - Nouvelle inscription")}
              className="ml-auto flex items-center gap-3 rounded-lg border-[1px] text-white border-blue-600 bg-blue-600 px-3 py-2 text-sm hover:bg-white hover:!text-blue-600 transition ease-in-out">
              <AiOutlinePlus className="text-white h-4 w-4 group-hover:!text-blue-600" />
              <p>Nouvelle inscription</p>
            </Link>
            <ExportComponent
              title="Exporter les inscriptions"
              exportTitle="Volontaires"
              route="/elasticsearch/young/export"
              filters={filterArray}
              selectedFilters={selectedFilters}
              setIsOpen={() => true}
              icon={<BsDownload className="text-white h-4 w-4 group-hover:!text-blue-600" />}
              css={{
                override: true,
                button: `group ml-auto flex items-center gap-3 rounded-lg border-[1px] text-white border-blue-600 bg-blue-600 px-3 py-2 text-sm hover:bg-white hover:!text-blue-600 transition ease-in-out`,
                loadingButton: `group ml-auto flex items-center gap-3 rounded-lg border-[1px] text-white border-blue-600 bg-blue-600 px-3 py-2 text-sm hover:bg-white hover:!text-blue-600 transition ease-in-out`,
              }}
              transform={async (data) => transformInscription(data)}
            />
            {[ROLES.REFERENT_DEPARTMENT, ROLES.REFERENT_REGION].includes(user.role) && (
              <ExportComponent
                title={user.role === ROLES.REFERENT_DEPARTMENT ? "Exporter les volontaires scolarisés dans le département" : "Exporter les volontaires scolarisés dans la région"}
                exportTitle="Volontaires"
                route="/elasticsearch/young/young-having-school-in-dep-or-region/export"
                filters={filterArray}
                selectedFilters={selectedFilters}
                setIsOpen={() => true}
                icon={<BsDownload className="text-white h-4 w-4 group-hover:!text-blue-600" />}
                css={{
                  override: true,
                  button: `group flex items-center gap-3 rounded-lg border-[1px] text-white border-blue-600 bg-blue-600 px-3 py-2 text-sm hover:bg-white hover:!text-blue-600 transition ease-in-out`,
                  loadingButton: `group ml-auto flex items-center gap-3 rounded-lg border-[1px] text-white border-blue-600 bg-blue-600 px-3 py-2 text-sm hover:bg-white hover:!text-blue-600 transition ease-in-out`,
                }}
                transform={async (data) => transformVolontairesSchool(data)}
              />
            )}
          </div>
        </div>
        <div className="mb-8 flex flex-col rounded-xl bg-white py-4">
          <div className="flex items-stretch justify-between  bg-white px-4 pt-2">
            <Filters
              pageId={pageId}
              route="/elasticsearch/young/search"
              setData={(value) => setData(value)}
              filters={filterArray}
              searchPlaceholder="Rechercher par prénom, nom, email, ville, code postal..."
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              paramData={paramData}
              setParamData={setParamData}
            />
            <SortOption
              sortOptions={[
                { label: "Nom (A > Z)", field: "lastName.keyword", order: "asc" },
                { label: "Nom (Z > A)", field: "lastName.keyword", order: "desc" },
                { label: "Prénom (A > Z)", field: "firstName.keyword", order: "asc" },
                { label: "Prénom (Z > A)", field: "firstName.keyword", order: "desc" },
                { label: "Date de création (récent > ancien)", field: "createdAt", order: "desc" },
                { label: "Date de création (ancien > récent)", field: "createdAt", order: "asc" },
              ]}
              paramData={paramData}
              setParamData={setParamData}
            />
          </div>
          <div className="mt-2 flex flex-row flex-wrap items-center px-4">
            <Save selectedFilters={selectedFilters} filterArray={filterArray} page={paramData?.page} pageId={pageId} />
            <SelectedFilters
              filterArray={filterArray}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              paramData={paramData}
              setParamData={setParamData}
            />
          </div>

          <ResultTable
            paramData={paramData}
            setParamData={setParamData}
            currentEntryOnPage={data?.length}
            render={
              <table className="mt-4 mb-2 w-full table-auto font-marianne">
                <thead>
                  <tr className="border-y-[1px] border-y-gray-100 uppercase text-gray-400 text-sm">
                    <th width="5%" className="pl-4 py-3">
                      #
                    </th>
                    <th width="35%" className="py-3">
                      Volontaire
                    </th>
                    <th className="text-center px-4 py-3">Cohorte</th>
                    <th className="text-center px-4 py-3">Statut</th>
                    <th width="20%" className="text-center pr-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((hit, i) => (
                    <Hit key={hit._id} hit={hit} index={i + paramData.page * 20} onClick={() => setYoung(hit)} selected={young?._id === hit._id} />
                  ))}
                </tbody>
              </table>
            }
          />
        </div>
      </div>
      {young !== null && young.status === YOUNG_STATUS.DELETED ? (
        <DeletedInscriptionPanel value={young} onChange={() => setYoung(null)} />
      ) : (
        <Panel value={young} onChange={() => setYoung(null)} />
      )}
    </>
  );
}

const Hit = ({ hit, index, onClick }) => {
  dayjs.extend(relativeTime).locale("fr");
  const diff = dayjs(new Date(hit.updatedAt)).fromNow();

  return (
    <tr onClick={onClick} className="border-b-[1px] border-y-gray-100 hover:bg-gray-50">
      <td className="pl-4 py-3 w-[5%] tesxt-gray-900 text-base">{index + 1}</td>
      <td className="py-3 w-[35%]">
        <span className="font-bold text-gray-900 leading-6">{hit.status !== "DELETED" ? `${hit.firstName} ${hit.lastName}` : "Compte supprimé"}</span>
        <p className="text-sm text-gray-600 leading-5">{`Mis à jour ${diff} • ${formatStringLongDate(hit.updatedAt)}`}</p>
      </td>
      <td className="text-center">
        <Badge color="#3B82F6" backgroundColor="#EFF6FF" text={hit.cohort} className={hit.status === "DELETED" ? "opacity-50" : ""} />
      </td>
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <SelectStatus hit={hit} options={[]} disabled />
      </td>
      <td className="w-[20%] pr-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Action hit={hit} />
      </td>
    </tr>
  );
};
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Action = ({ hit }) => {
  const user = useSelector((state) => state.Auth.user);

  return (
    <Listbox>
      {({ open }) => (
        <>
          <div className="relative w-4/5 mx-auto">
            <Listbox.Button className="relative w-full text-left">
              <div className={`${open ? "border-blue-500" : ""} flex items-center gap-0 space-y-0 rounded-lg border-[1px] bg-white py-2 px-2.5`}>
                <div className="flex w-full items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Choisissez une action</p>
                  </div>
                  <div className="pointer-events-none flex items-center pr-2">
                    {open && <HiOutlineChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                    {!open && <HiOutlineChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              </div>
            </Listbox.Button>

            <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="max-h-60 absolute z-10 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <Link className="!cursor-pointer" to={`/volontaire/${hit._id}`} onClick={() => plausibleEvent("Volontaires/CTA - Consulter profil volontaire")} target="_blank">
                  <Listbox.Option className={("text-gray-900", "relative cursor-pointer select-none list-none py-2 pl-3 pr-9 hover:text-white hover:bg-blue-600")}>
                    <span className={"block truncate font-normal text-xs"}>Consulter le profil</span>
                  </Listbox.Option>
                </Link>
                {[ROLES.ADMIN, ROLES.REFERENT_DEPARTMENT, ROLES.REFERENT_REGION].includes(user.role) && hit.status !== YOUNG_STATUS.DELETED ? (
                  <a
                    className="!cursor-pointer"
                    href={`${appURL}/auth/connect?token=${api.getToken()}&young_id=${hit._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => plausibleEvent("Volontaires/CTA - Prendre sa place")}>
                    <Listbox.Option
                      className={({ active }) => classNames(active ? "bg-blue-600 text-white" : "text-gray-900", "relative cursor-pointer select-none list-none py-2 pl-3 pr-9")}>
                      <div className={"block truncate font-normal text-xs"}>Prendre sa place</div>
                    </Listbox.Option>
                  </a>
                ) : null}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};
