import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// const users = [
//   {
//     email: "sfinneral@gmail.com",
//     firstName: "Steve",
//     lastName: "Finneral",
//   },
//   {
//     email: "sfinneral+mark@gmail.com",
//     firstName: "Mark",
//     lastName: "Finneral",
//   },
//   {
//     email: "sfinneral+kevin@gmail.com",
//     firstName: "Kevin",
//     lastName: "Ryan",
//   },
//   {
//     email: "sfinneral+tim@gmail.com",
//     firstName: "Tim",
//     lastName: "LaPointe",
//   },
//   {
//     email: "sfinneral+mike@gmail.com",
//     firstName: "Mike",
//     lastName: "Soha",
//   },
//   {
//     email: "sfinneral+rich@gmail.com",
//     firstName: "Rich",
//     lastName: "Wynkoop",
//   },
//   {
//     email: "sfinneral+peter@gmail.com",
//     firstName: "Peter",
//     lastName: "Garrigan",
//   },
//   {
//     email: "sfinneral+al@gmail.com",
//     firstName: "Al",
//     lastName: "Patterson",
//   },
//   {
//     email: "sfinneral+thomas@gmail.com",
//     firstName: "Thomas",
//     lastName: "Slattery",
//   },
//   {
//     email: "sfinneral+liam@gmail.com",
//     firstName: "Liam",
//     lastName: "Gleason",
//   },
//   {
//     email: "sfinneral+sean@gmail.com",
//     firstName: "Sean",
//     lastName: "Dolan",
//   },
//   {
//     email: "sfinneral+gary@gmail.com",
//     firstName: "Gary",
//     lastName: "McPhillips",
//   },
//   {
//     email: "sfinneral+chuck@gmail.com",
//     firstName: "Chuck",
//     lastName: "Purtell",
//   },
//   {
//     email: "sfinneral+glenn@gmail.com",
//     firstName: "Glenn",
//     lastName: "Thoene",
//   },
//   {
//     email: "sfinneral+bill@gmail.com",
//     firstName: "Bill",
//     lastName: "Letendre",
//   },
//   {
//     email: "sfinneral+rop@gmail.com",
//     firstName: "Rob",
//     lastName: "Hardy",
//   },
//   {
//     email: "sfinneral+bob@gmail.com",
//     firstName: "Bob",
//     lastName: "Ware",
//   },
//   {
//     email: "sfinneral+marko@gmail.com",
//     firstName: "Mark",
//     lastName: "O'Connell",
//   },
//   {
//     email: "sfinneral+mikeB@gmail.com",
//     firstName: "Mike",
//     lastName: "Britton",
//   },
//   {
//     email: "sfinneral+charlie@gmail.com",
//     firstName: "Charlie",
//     lastName: "Demers",
//   },
//   {
//     email: "sfinneral+steveD@gmail.com",
//     firstName: "Steve",
//     lastName: "DeVeau",
//   },
//   {
//     email: "sfinneral+george@gmail.com",
//     firstName: "George",
//     lastName: "Clancy",
//   },
//   {
//     email: "sfinneral+kevinl@gmail.com",
//     firstName: "Kevin",
//     lastName: "Lynch",
//   },
//   {
//     email: "sfinneral+rodg@gmail.com",
//     firstName: "Rod",
//     lastName: "Gregoire",
//   },
// ];

// const password = "!JohnVal13!";
// const phoneNumber = "555-555-6666";

async function seed() {
  // users.forEach(async (user) => {
  //   const { email, firstName, lastName } = user;
  //   // cleanup the existing database
  //   await prisma.user.delete({ where: { email } }).catch((error) => {
  //     // no worries if it doesn't exist yet
  //     console.log(error, "error deleting existing users");
  //   });
  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   await prisma.user.create({
  //     data: {
  //       email,
  //       password: {
  //         create: {
  //           hash: hashedPassword,
  //         },
  //       },
  //       profile: {
  //         create: {
  //           phoneNumber,
  //           firstName,
  //           lastName,
  //         },
  //       },
  //     },
  //   });
  // });

  console.log(`Database has been seeded with users. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
