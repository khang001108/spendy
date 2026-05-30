CREATE TABLE "NotifSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expenseReminder" BOOLEAN NOT NULL DEFAULT true,
    "expenseReminderTime" TEXT NOT NULL DEFAULT '20:00',
    "goalReminder" BOOLEAN NOT NULL DEFAULT true,
    "budgetWarning" BOOLEAN NOT NULL DEFAULT true,
    "billReminder" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotifSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotifSetting_userId_key" ON "NotifSetting"("userId");

ALTER TABLE "NotifSetting" ADD CONSTRAINT "NotifSetting_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
