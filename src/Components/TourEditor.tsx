import React, { useState, useEffect } from "react";
import { Chat } from "../App";
import { getTour, saveTour } from "../db/tour";
import { Tour } from "./TourManager";
import { useParams } from "react-router-dom";
import { Label, TextInput, Textarea, Button, Card, Spinner } from "flowbite-react";
import { CiEdit } from "react-icons/ci";
import { IoMdClose } from "react-icons/io";
import { MdAdd } from "react-icons/md";
import { HiTrash } from "react-icons/hi";

type TourEditorProps = {
  chat: Chat;
  authorizedUserId: string | null;
  displayName: string;
  activeMenu: any;
};

const EditField = ({
  label,
  value,
  field,
  editField,
  onEdit,
  onCancel,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  field: string;
  editField: string | null;
  onEdit: (field: string) => void;
  onCancel: () => void;
  onChange: (field: string, value: any) => void;
  type?: "text" | "number" | "textarea";
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && (
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </Label>
        )}
        {editField === field ? (
          <div className="flex space-x-2">
            <Button
              size="xs"
              color="failure"
              onClick={onCancel}
              className="text-red-700 dark:text-red-500 bg-transparent border-none shadow-none"
            >
              <IoMdClose size="1.2em" />
            </Button>
          </div>
        ) : (
          <Button
            size="xs"
            onClick={() => onEdit(field)}
            className="text-green-700 dark:text-green-500 bg-transparent border-none shadow-none"
          >
            <CiEdit size="1.2em" />
          </Button>
        )}
      </div>
      {editField === field ? (
        type === "textarea" ? (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full rounded-lg"
            rows={4}
          />
        ) : (
          <TextInput
            type={type}
            value={value || (type === "number" ? 0 : "")}
            onChange={(e) =>
              onChange(
                field,
                type === "number" ? parseFloat(e.target.value) : e.target.value
              )
            }
            className="w-full rounded-lg"
          />
        )
      ) : (
        <div className="p-2.5 bg-gray-100 dark:bg-gray-600 rounded-lg">
          <span className="text-gray-900 dark:text-white">{value != null ? value.toString() : "N/A"}</span>
        </div>
      )}
    </div>
  );
};

export const TourEditor = (props: TourEditorProps) => {
  const [tour, setTour] = useState<Tour | undefined>(undefined);
  const { tourId } = useParams();
  const [editField, setEditField] = useState<string | null>(null);
  const [featureImage, setFeatureImage] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tourId) return;
    fetchTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  const fetchTour = async () => {
    try {
      const rsp = await getTour(tourId as string);
      if (rsp.status === 200) {
        const data = rsp.data;
        setTour(data);
        setFeatureImage(data.featureImgUrl);
        setSlots(data.slots || []);
        setPrices(data.prices || []);
      } else {
        console.error("Failed to fetch tour:", rsp.status);
      }
    } catch (error) {
      console.error("Error fetching tour:", error);
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleEditClick = (field: string) => {
    setEditField(field);
  };

  const handleInputChange = (field: string, value: any) => {
    setTour((prevTour) => {
      if (!prevTour) return prevTour;
      return {
        ...prevTour,
        [field]: value,
      };
    });
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFeatureImage(imageUrl);
        handleInputChange("featureImgUrl", imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!tour) return;
    setIsSaving(true);
    try {
      const tourToSave = {
        ...tour,
        slots: slots,
        prices: prices
      };
      const rsp = await saveTour(tourToSave);
      if (rsp.status === 200) {
        const data = rsp.data;
        setTour(data);
        setSlots(data.slots || []);
        setPrices(data.prices || []);
        console.info("Tour changes saved successfully");
        alert("Changes saved successfully");
      } else {
        console.error("Failed to save tour:", rsp.status);
      }
    } catch (error) {
      console.error("Error saving tour:", error);
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setEditField(null);
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = (index: number) => {
    const updatedSlots = slots.filter((_, i) => i !== index);
    setSlots(updatedSlots);
  };

  const handleDeletePrice = (index: number) => {
    const updatedPrices = prices.filter((_, i) => i !== index);
    setPrices(updatedPrices);
  };

  const handleCancel = () => {
    setEditField(null);
  };

  const handleAddSlot = () => {
    setSlots([...slots, { startTime: "", endTime: "" }]);
  };

  const handleEditSlot = (index: number, field: string, value: string) => {
    const updatedSlots = [...slots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setSlots(updatedSlots);
  };

  const handleAddPrice = () => {
    setPrices([...prices, 0]);
  };

  const handleEditPrice = (index: number, value: number) => {
    const updatedPrices = [...prices];
    updatedPrices[index] = value;
    setPrices(updatedPrices);
  };

  if (!tour) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-6 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800 pb-20">
      <Card className="dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center sm:text-left">
            {tour.name || "Tour Details"}
          </h1>
          <Button size="xs" onClick={() => handleEditClick("name")} className="bg-transparent hover:text-green-500 border-none shadow-none">
            <CiEdit size="1.5em" />
          </Button>
        </div>

        {editField === "name" && (
          <div className="mb-4">
            <TextInput
              value={tour.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Tour Name"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <span className="text-xs italic font-thin text-gray-500 dark:text-gray-400">
              ID: {tour.tourId}
            </span>
          </div>

          <EditField
            label="Locale Name"
            value={tour.localeName}
            field="localeName"
            editField={editField}
            onEdit={handleEditClick}
            onCancel={handleCancel}
            onChange={handleInputChange}
          />

          <div className="space-y-2 col-span-full">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Feature Image
              </Label>
              {editField === "featureImgUrl" ? (
                <div className="flex space-x-2">
                  <Button
                    size="xs"
                    color="failure"
                    onClick={handleCancel}
                    className="bg-transparent border-none shadow-none"
                  >
                    <IoMdClose size="1.5em" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="xs"
                  onClick={() => handleEditClick("featureImgUrl")}
                  className="text-green-700 dark:text-green-500 bg-transparent border-none shadow-none"
                >
                  <CiEdit size="1.5em" />
                </Button>
              )}
            </div>
            {editField === "featureImgUrl" ? (
              <div className="space-y-4">
                <TextInput
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-lg"
                />
                {featureImage && (
                  <img
                    src={featureImage}
                    alt="Feature preview"
                    className="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                )}
              </div>
            ) : featureImage ? (
              <img
                src={featureImage}
                alt="Feature"
                className="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="p-2.5 bg-gray-100 dark:bg-gray-600 rounded-lg">
                <span className="text-gray-900 dark:text-white">No image available</span>
              </div>
            )}
          </div>

          <EditField
            label="Details"
            value={tour.details}
            field="details"
            editField={editField}
            onEdit={handleEditClick}
            onCancel={handleCancel}
            onChange={handleInputChange}
            type="textarea"
          />
          <EditField
            label="Detail Url"
            value={tour.detailUrl}
            field="detailUrl"
            editField={editField}
            onEdit={handleEditClick}
            onCancel={handleCancel}
            onChange={handleInputChange}
          />
          <EditField
            label="Max Group"
            value={tour.maxGroup}
            field="maxGroup"
            editField={editField}
            onEdit={handleEditClick}
            onCancel={handleCancel}
            onChange={handleInputChange}
            type="number"
          />
          <EditField
            label="Display Offset"
            value={tour.displayOffset}
            field="displayOffset"
            editField={editField}
            onEdit={handleEditClick}
            onCancel={handleCancel}
            onChange={handleInputChange}
            type="number"
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Slots:
            </Label>
            <Button size="xs" onClick={handleAddSlot} className="text-green-700 hover:text-green-500 bg-transparent border-none shadow-none">
              <MdAdd size="1.5em" />
            </Button>
          </div>
          <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-md text-gray-900 dark:text-white space-y-2">
            {slots && slots.length > 0 ? (
              slots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <TextInput
                    type="time"
                    value={slot?.startTime || ""}
                    onChange={(e) => handleEditSlot(index, "startTime", e.target.value)}
                    className="w-[45%]"
                  />
                  <TextInput
                    type="time"
                    value={slot?.endTime || ""}
                    onChange={(e) => handleEditSlot(index, "endTime", e.target.value)}
                    className="w-[45%]"
                  />
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => handleDeleteSlot(index)}
                    className="bg-transparent border-none shadow-none text-red-600"
                  >
                    <HiTrash size="1.2em" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No slots available</div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prices:
            </Label>
            <Button size="xs" onClick={handleAddPrice} className="text-green-700 hover:text-green-500 bg-transparent border-none shadow-none">
              <MdAdd size="1.5em" />
            </Button>
          </div>
          <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-md text-gray-900 dark:text-white space-y-2">
            {prices && prices.length > 0 ? (
              prices.map((price, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-grow text-sm">
                    {`For ${index + 1} ${index === 0 ? 'person' : 'people'}: `}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <TextInput
                      type="number"
                      value={price}
                      onChange={(e) => handleEditPrice(index, parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </div>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => handleDeletePrice(index)}
                    className="bg-transparent border-none shadow-none text-red-600"
                  >
                    <HiTrash size="1.2em" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No prices available</div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            color="green"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-48"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
