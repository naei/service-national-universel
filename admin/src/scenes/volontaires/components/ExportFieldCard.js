import React, { useState } from "react";
import { Field } from "formik";

export default function ExportFieldCard({ category, values, setFieldValue, selectedFields, setSelectedFields, fieldCategories }) {
  console.log("🚀 ~ file: ExportFieldCard.js ~ line 5 ~ ExportFieldCard ~ category", category);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border-2 border-gray-100 px-3 py-2 hover:shadow-ninaButton cursor-pointer">
      <div
        onClick={() => {
          if (!values.checked.includes(category.id)) {
            const newValues = [...values.checked, category.id];
            console.log("🚀 ~ file: ExportFIeldCard.js ~ line 16 ~ ExportFieldCard ~ fieldGroups[field.value]", fieldCategories[category.id]);
            setFieldValue("checked", newValues);
            setSelectedFields((selectedFields) => ({ ...selectedFields, ...category.fields }));
          } else {
            const newValues = values.checked.filter((item) => item !== category.id);
            setFieldValue("checked", newValues);
            let copiedSelectedFields = { ...selectedFields };
            for (const item in category.fields) {
              delete copiedSelectedFields[item];
            }
            setSelectedFields(() => ({ ...copiedSelectedFields }));
          }
        }}>
        <div className="flex justify-between w-full">
          <div className="text-left text-lg w-3/4">{category.id}</div>
          <div className="h-4">
            <Field type="checkbox" name="checked" value={category.id} />
          </div>
        </div>
        <div className={`w-full text-gray-400 text-left h-${isOpen ? "auto" : 16} overflow-hidden`}>
          {Object.keys(category.fields).map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      </div>
      {category.fields.length > 3 && (
        <button className="text-gray-500 text-center w-full hover:text-gray-800" onClick={() => setIsOpen(!isOpen)}>
          {!isOpen ? "Voir plus" : "Réduire"}
        </button>
      )}
    </div>
  );
}
