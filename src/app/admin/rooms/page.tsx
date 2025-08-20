"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import DataTable from "@/components/DataTable";
import { MdAdd, MdMeetingRoom } from "react-icons/md";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shadow-sm">
              <MdMeetingRoom className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rooms</h1>
              <p className="text-slate-600 text-sm">
                Manage room information and classroom assignments
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:from-purple-600 hover:to-purple-700"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">Room Records</h2>
          <p className="text-slate-600 text-sm mt-1">
            A comprehensive list of all rooms with their details and capacity
            information
          </p>
        </div>
        <div className="p-6">
          <DataTable
            data={rooms}
            columns={[
              {
                header: "Room Number",
                accessor: "room_number",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((room) => room.room_number)),
                ],
              },
              {
                header: "Room Type",
                accessor: "room_type",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(
                    data.map((room) => room.room_type || "Not specified")
                  ),
                ],
              },
              {
                header: "Capacity",
                accessor: "capacity",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(
                    data.map((room) => String(room.capacity || "Not specified"))
                  ),
                ],
              },
            ]}
            searchFields={["room_number", "room_type"]}
            isLoading={isLoading}
            onEdit={(id) => {
              // TODO: Implement edit functionality
              console.log("Edit room:", id);
            }}
            onDelete={async (id) => {
              // TODO: Implement delete functionality
              console.log("Delete room:", id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
