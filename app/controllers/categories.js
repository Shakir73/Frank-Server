"use strict";

const Q = require("q");
var fs = require("fs");

const Category = include("models/category");
const Admin = include("models/admin");

class CategoriesController {
  async importCategories() {
    return { status: 403, message: "forbidden" };
    let fileData = await fs.readFileSync("files/categories.txt");

    let level1 = [];
    let level2 = [];
    let currentParent0;
    let currentParent1;
    let level0Name = "";
    let level1Name = "";
    let level2Name = "";
    let array = fileData.toString().split("\n");
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      let line = element.split(">");
      if (line.length > 0) {
        let cat = line[0];
        if (level0Name != cat) {
          level0Name = cat;
          let data = { name: cat.trim(), level: 0 };
          let service = new Category(data);
          await service.save();
          currentParent0 = service;
        }
        if (line.length > 1) {
          let cat = line[1];
          if (level1Name != cat) {
            level1Name = cat;
            let data = {
              name: cat.trim(),
              level: 1,
              parent: currentParent0._id
            };
            let service = new Category(data);
            await service.save();
            currentParent1 = service;
          }
          if (line.length > 2) {
            let cat = line.length === 3 ? line[2] : line[3];

            if (level2Name != cat) {
              level2Name = cat;
              let data = {
                name: cat.trim(),
                level: 2,
                parent: currentParent1._id
              };
              let service = new Category(data);
              await service.save();
            }
          }
        }
      }
    }
    return this.getServices();
  }

  async temp() {
    return { status: 403, message: "forbidden" };
    let lang = ["en", "ar", "nl", "fr", "de", "it", "pl", "ru", "es", "tr"];
    let final = {
      en: {},
      ar: {},
      nl: {},
      fr: {},
      de: {},
      it: {},
      pl: {},
      ru: {},
      es: {},
      tr: {}
    };
    let fileData = await fs.readFileSync("files/test.csv");
    let array = fileData.toString().split("\n");
    // console.log(array);
    for (let index = 0; index < array.length; index++) {
      let line = array[index];
      let words = line.split(",");
      for (let i = 0; i < 10; i++) {
        let eng = words[0];
        let translation = words[i];
        const key = eng.split(" ").join("");
        let obj = final[lang[i]];
        // console.log(eng + " = " + translation);
        obj[key] = translation;
      }
    }
    final["en-US"] = final.en;
    await fs.writeFileSync("files/translations", JSON.stringify(final), {
      encoding: "utf8"
    });
    // console.log(final);
  }

  async create(data) {
    console.log(data);
    let service = new Category(data);
    await service.save();
    return { status: 200, data: service };
  }

  async getServices(user) {
    var approved = true;
    console.log(user);
    if (user) {
      let admin = await Admin.findById(user._id);
      if (admin) {
        approved = false;
      }
    }
    let data = await Category.getAll(approved);
    return { status: 200, data };
  }

  async search(text) {
    let data = await Category.search(text);
    if (data.length === 0) {
      let category = await Category.findById("5d08b36263579ba057ed0973");
      data = [category];
    }
    console.log("data: ", data);
    return { status: 200, data };
  }

  async getById(id) {
    let category = await Category.findById(id);
    return { status: 200, data: category };
  }

  async getByParent(id) {
    let category = await Category.findByParent(id);
    return { status: 200, data: category };
  }

  async update(user, data) {
    // return { status: 403, message: "forbidden" };
    /*let array = [
      {
        ParcelType: "Letter, Regular Document",
        Length: 9.25,
        width: 6.37,
        Height: 0.2,
        Weight: 0.25,
        note: "standard letter envelope size"
      },
      {
        ParcelType: "Home item: small lightweight",
        Length: 12,
        width: 12,
        Height: 12,
        Weight: 1,
        note: "medium size cardboard package"
      },
      {
        ParcelType: "Books, Stationery item",
        Length: 16,
        width: 12,
        Height: 12,
        Weight: 2,
        note: "common book cardboard size"
      },
      {
        ParcelType: "Sports: small lightweight",
        Length: 18,
        width: 12,
        Height: 12,
        Weight: 2,
        note: "long medium size box"
      },
      {
        ParcelType: "Tools: small lightweight",
        Length: 12,
        width: 12,
        Height: 12,
        Weight: 2,
        note: "medium size cardboard package"
      },
      {
        ParcelType: "Other common lightweight",
        Length: 12,
        width: 12,
        Height: 12,
        Weight: 1,
        note: "medium size cardboard package"
      },
      {
        ParcelType: "Makeup, Beauty Care item",
        Length: 8,
        width: 8,
        Height: 8,
        Weight: 0.5,
        note: "medium bottle box size"
      },
      {
        ParcelType: "Clothes, Wear, Shoes",
        Length: 14,
        width: 10,
        Height: 5,
        Weight: 0.5,
        note: "standard shoe box size"
      },
      {
        ParcelType: "Pet item, Fun item, Toys",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Artificial gems jewels",
        Length: 11,
        width: 7,
        Height: 2,
        Weight: 0.25,
        note: "common necklace box size"
      },
      {
        ParcelType: "Small Décor, Show-piece",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Other Attire, Décor item",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Glass, Crockery: fragile",
        Length: 12,
        width: 6,
        Height: 6,
        Weight: 0.25,
        note: "medium size 6-pack glass box"
      },
      {
        ParcelType: "Gadget, Mobile, Camera",
        Length: 7.85,
        width: 5.15,
        Height: 1.4,
        Weight: 0.25,
        note: "common mobile box size"
      },
      {
        ParcelType: "Meter, Device, Watches",
        Length: 4,
        width: 4,
        Height: 3,
        Weight: 0.25,
        note: "common wrist watch box size"
      },
      {
        ParcelType: "Computer, Audio/Video Player",
        Length: 18,
        width: 13,
        Height: 4,
        Weight: 2.3,
        note: "medium laptop box size"
      },
      {
        ParcelType: "Music Instrument: small",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Other Fragile, Digital item",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Food item: perishable",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Food item: not perishable",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Flowers, Fruits, Plants",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Perfume, Fragrance *",
        Length: 3,
        width: 3,
        Height: 5.5,
        Weight: 0.5,
        note: "medium size bottle box"
      },
      {
        ParcelType: "Liquid, Oil, Chemical *",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Other Perishable item *",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Big appliances (Tv, AC etc)",
        Length: 38,
        width: 26,
        Height: 8,
        Weight: "",
        note: "normal plasma tv box size"
      },
      {
        ParcelType: "Furniture, Heavy Wood",
        Length: 90,
        width: 60,
        Height: 36,
        Weight: "",
        note: "3-seater sofa size"
      },
      {
        ParcelType: "Heavy Metal, Mineral item",
        Length: 144,
        width: 12,
        Height: 12,
        Weight: "",
        note: "room carpet roll size"
      },
      {
        ParcelType: "Long item: Rod, Pipe, Carpet",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Sports, Gym item: big heavy",
        Length: 60,
        width: 40,
        Height: 9,
        Weight: 9,
        note: "medium bicycle size box"
      },
      {
        ParcelType: "Other heavy, over-size item",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Medicine, Drugs *",
        Length: 14,
        width: 10,
        Height: 2.5,
        Weight: 0.5,
        note: "common first aid kit size"
      },
      {
        ParcelType: "Health, Hospital accessories",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Legal or Govt Document",
        Length: 9.5,
        width: 6,
        Height: 0.25,
        Weight: 0.1,
        note: "A10 envelop size"
      },
      {
        ParcelType: "Scientific Equipment",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Automotive, Vehicle Parts",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Other Special item",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Financial Document",
        Length: 15,
        width: 9,
        Height: 0.25,
        Weight: 0.25,
        note: "Legal page size envelop"
      },
      {
        ParcelType: "Antique piece, Rare item",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Costly Artwork, Painting",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Precious gems, jewels, watch",
        Length: 11,
        width: 7,
        Height: 2,
        Weight: 0.25,
        note: "regular necklace box size"
      },
      {
        ParcelType: "Industrial Equipment",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Other costly, valued item *",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Mix items: in bag, suitcase",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Mix items: light + heavy",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Mix items: small + big size",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Mix items: fragile + food",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Mix items: home + health",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      },
      {
        ParcelType: "Mix items: Other different",
        Length: "",
        width: "",
        Height: "",
        Weight: "",
        note: ""
      }
    ];
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      let cat = await Category.findByName(element.ParcelType);
      if (cat) {
        console.log(element);
        console.log(cat);
        await Category.updateById(cat._id, {
          length: element.Length,
          width: element.width,
          height: element.Height,
          weight: element.Weight,
          note: element.note
        });
      } else {
        console.log(element.ParcelType);
      }
    }
    return {};*/
    return Category.updateById(data._id, data);
  }
}

var exports = (module.exports = new CategoriesController());
