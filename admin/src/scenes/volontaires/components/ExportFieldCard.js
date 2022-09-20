import React, { useState } from "react";
import { Field } from "formik";

export default function ExportFieldCard({ fields, values, setFieldValue, selectedFields, setSelectedFields, fieldGroups }) {
  console.log("🚀 ~ file: ExportFIeldCard.js ~ line 5 ~ ExportFieldCard ~ fields", fields);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border-2 border-gray-100 px-3 py-2 hover:shadow-ninaButton cursor-pointer">
      <div
        onClick={() => {
          if (!values.checked.includes(fields.value)) {
            const newValues = [...values.checked, field.value];
            console.log("🚀 ~ file: ExportFIeldCard.js ~ line 16 ~ ExportFieldCard ~ fieldGroups[field.value]", fieldGroups[field.value]);
            setFieldValue("checked", newValues);
            setSelectedFields((selectedFields) => ({ ...selectedFields, ...fieldGroups[field.value] }));
          } else {
            const newValues = values.checked.filter((item) => item !== field.value);
            setFieldValue("checked", newValues);
            let copiedSelectedFields = { ...selectedFields };
            for (const item in fieldGroups[field.value]) {
              delete copiedSelectedFields[item];
            }
            setSelectedFields(() => ({ ...copiedSelectedFields }));
          }
        }}>
        <div className="flex justify-between w-full">
          <div className="text-left text-lg w-3/4">{field.title}</div>
          <div className="h-4">
            <Field type="checkbox" name="checked" value={field.value} />
          </div>
        </div>
        <div className={`w-full text-gray-400 text-left h-${isOpen ? "auto" : 16} overflow-hidden`}>
          {Object.values(fields).map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      </div>
      {field.desc.length > 3 && (
        <button className="text-gray-500 text-center w-full hover:text-gray-800" onClick={() => setIsOpen(!isOpen)}>
          {!isOpen ? "Voir plus" : "Réduire"}
        </button>
      )}
    </div>
  );
}
