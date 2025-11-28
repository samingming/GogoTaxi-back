/*
  Warnings:

  - A unique constraint covering the columns `[room_id,seat_number]` on the table `RoomParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RoomParticipant_room_id_seat_number_key" ON "RoomParticipant"("room_id", "seat_number");
