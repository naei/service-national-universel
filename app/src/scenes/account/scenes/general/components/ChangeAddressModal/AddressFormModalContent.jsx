import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toastr } from "react-redux-toastr";
import Modal from "../../../../../../components/ui/modals/Modal";
import Input from "../../../../../../components/forms/inputs/Input";
import LocationMarker from "../../../../../../assets/icons/LocationMarker";
import ButtonPrimary from "../../../../../../components/ui/buttons/ButtonPrimary";
import ButtonLight from "../../../../../../components/ui/buttons/ButtonLight";
import { formatResult, getSuggestions } from "../../../../../../services/api-adresse";
import { capture } from "../../../../../../sentry";
import { updateYoung } from "../../../../../../services/young.service";
import { setYoung } from "../../../../../../redux/auth/actions";

const emptyAddress = { address: "", zip: "", city: "" };

const AddressFormModalContent = ({ onClose }) => {
  const [formValues, setFormValues] = useState(emptyAddress);
  const [suggestion, setSuggestion] = useState();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();

  const handleChangeValue = (inputName) => (value) => {
    setSuggestion(undefined);
    setFormValues((prevValues) => ({
      ...prevValues,
      [inputName]: value,
    }));
  };

  const validateForm = () => {
    const foundErrors = {};
    let hasError = false;
    if (!formValues.address) {
      foundErrors.address = "Ce champ est obligatoire";
      hasError = true;
    }
    if (!formValues.zip) {
      foundErrors.zip = "Ce champ est obligatoire";
      hasError = true;
    }
    if (!formValues.city) {
      foundErrors.city = "Ce champ est obligatoire";
      hasError = true;
    }
    setErrors(foundErrors);
    return !hasError;
  };

  const onAddressVerify = async () => {
    if (!validateForm()) {
      return;
    }
    const updatedSuggestion = await getSuggestions(formValues.address, formValues.city, formValues.zip);
    setSuggestion(updatedSuggestion);
  };

  const onAddressVerified = (isConfirmed) => async () => {
    const formattedSuggestion = formatResult(suggestion);
    try {
      setSubmitting(true);
      const updates = {
        addressVerified: "true",
        cityCode: formattedSuggestion.cityCode,
        region: formattedSuggestion.region,
        department: formattedSuggestion.department,
        location: formattedSuggestion.location,
        // if the suggestion is not confirmed we keep the address typed by the user
        address: isConfirmed ? formattedSuggestion.address : formValues.address,
        zip: isConfirmed ? formattedSuggestion.zip : formValues.zip,
        city: isConfirmed ? formattedSuggestion.city : formValues.city,
        // @todo: foreing addresse
        country: "France",
      };
      const { title, message, data: updatedYoung } = await updateYoung("address", updates);
      toastr.success(title, message);
      dispatch(setYoung(updatedYoung));
      setFormValues(emptyAddress);
      setSuggestion(undefined);
      setErrors({});
      onClose();
    } catch (error) {
      const { title, message } = error;
      toastr.error(title, message);
      capture(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal.Title>Saisir votre nouvelle adresse</Modal.Title>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}>
        <Input label="Adresse" name="address" value={formValues.address} onChange={handleChangeValue("address")} error={errors.address} />
        <Input label="Code Postal" name="zip" value={formValues.zip} onChange={handleChangeValue("zip")} error={errors.zip} />
        <Input label="Ville" name="city" value={formValues.city} onChange={handleChangeValue("city")} error={errors.city} />
        {!suggestion && (
          <Modal.Buttons
            onCancel={onClose}
            onConfirm={onAddressVerify}
            cancelText="Annuler"
            confirmText={
              <>
                <LocationMarker />
                <span>Vérifier mon adresse</span>
              </>
            }
          />
        )}
        {suggestion && !suggestion.ok && (
          <div className="flex justify-center">
            <div className="text-sm text-red-500 flex-1 pr-2">L&apos;adresse saisie n&apos;a pas été trouvée.</div>
            <ButtonLight onClick={() => setSuggestion(null)}>Réessayer</ButtonLight>
          </div>
        )}
        {suggestion && suggestion.ok && (
          <>
            <div className="text-sm text-gray-500">Est-ce que c’est la bonne adresse ?</div>
            <strong className="text-sm font-medium text-gray-900">
              {suggestion.properties.name}, {`${suggestion.properties.postcode} ${suggestion.properties.city}`}
            </strong>
            <Modal.ButtonContainer className="md:flex-col">
              <ButtonPrimary onClick={onAddressVerified(true)}>Oui</ButtonPrimary>
              <ButtonLight onClick={onAddressVerified()}>{`Non, garder "${formValues.address}, ${formValues.zip} ${formValues.city}"`}</ButtonLight>
            </Modal.ButtonContainer>
          </>
        )}
      </form>
    </>
  );
};

export default AddressFormModalContent;
