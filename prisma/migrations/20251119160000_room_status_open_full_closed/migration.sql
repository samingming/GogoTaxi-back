-- Alter enum values for RoomStatus
CREATE TYPE "RoomStatus_new" AS ENUM ('open', 'full', 'closed');

ALTER TABLE "Room" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Room"
  ALTER COLUMN "status"
  TYPE "RoomStatus_new"
  USING (
    CASE "status"
      WHEN 'recruiting' THEN 'open'
      WHEN 'dispatching' THEN 'full'
      ELSE 'closed'
    END
  )::"RoomStatus_new";

ALTER TABLE "Room" ALTER COLUMN "status" SET DEFAULT 'open';

DROP TYPE "RoomStatus";
ALTER TYPE "RoomStatus_new" RENAME TO "RoomStatus";
