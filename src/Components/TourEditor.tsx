import React, { useState, useEffect } from "react";
import { Chat } from "../App";
import { getTour } from "../db/tour";
import { Tour } from "./TourManager";
import { useParams } from "react-router-dom";

type TourEditorProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any
}

export const TourEditor = (props: TourEditorProps) => {
  const [tour, setTour] = useState<Tour>()
  const { tourId } = useParams()

  useEffect(() => {
    if (tourId === undefined) {
      return
    }
    fetchTour()
    // eslint-disable-next-line
  }, [tourId]);


  const fetchTour = () => {

    getTour(tourId as string)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setTour(data)
            })
        }
      })
  }

  return (
    <div className="flex flex-col h-full pt-3 relative">
      <div
        className="flex flex-row items-center border border-gray-300 shadow-xl pl-2 rounded-md bg-white dark:bg-slate-500 "
      >
      </div>
    </div>
  );
}
