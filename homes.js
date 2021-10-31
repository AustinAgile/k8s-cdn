const csv = require('csv-parser')
const fs = require('fs')
const _ = require('lodash')
// const results = [];
var promises = [];
promises.push(new Promise((resolve,reject) => {
  var homes = [];
  fs.createReadStream('../GeoData/COVID-19_Nursing_Home_Dataset.csv')
    .pipe(csv())
    .on('data', (data) => homes.push(data))
    .on('end', () => {
      // console.log("First result");
      // console.log(results[0]);
      // a(results);
      resolve(homes);
    })
  ;
}));
promises.push(new Promise((resolve,reject) => {
  var zips = [];
  fs.createReadStream('../GeoData/ZIP-COUNTY-FIPS_2017-06.csv')
    .pipe(csv())
    .on('data', function(data) {
      zips.push(data);
    })
    .on('end', () => {
      // console.log("First result");
      // console.log(results[0]);
      // a(results);
      var crap = _.transform(zips, function(zips, zip) {
        zips["ZIP"+zip.ZIP] = zip;
        return zips;
      }, {});
      console.log(crap["ZIP35481"]);
      resolve(crap);
    })
  ;
}));


Promise.all(promises)
  .then(function(results) {
    console.log("First result");
    console.log(results[0][0]);
    console.log(results[1][0]);
    var counties = getHomesByCounty(results[0], results[1]);
    console.log(counties['no FIPS'].length);
  })
;


function getHomesByCounty(homes, zips) {
  var globalProperties = ["Provider Name","Provider Address","Provider City","Provider State","Provider Zip Code","Federal Provider Number"];
  var countOmits = globalProperties.concat(["submitted_data"]);
  var re = new RegExp(/POINT \((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);

  var counties = _.reduce(homes, function(counties, providerWeek) {
    var fpn = "FPN"+providerWeek["Federal Provider Number"];
    // var zipMetadata = _.find(zips, function(o) {
    //   return o.ZIP == providerWeek["Provider Zip Code"];
    // });
    var zipMetadata = zips["ZIP"+providerWeek["Provider Zip Code"]];
    if (providerWeek["Provider Zip Code"] == 35481 || providerWeek["Provider Zip Code"] == 35442) {
      console.log("ZIP CODE IS "+providerWeek["Provider Zip Code"]);
      console.log(zipMetadata);
    }
    if (!zips.hasOwnProperty("ZIP"+providerWeek["Provider Zip Code"])) {
      var fips = "no ZIP";
      // console.log("no ZIP");
      // console.log(providerWeek["Provider Zip Code"]);
      // providers[providerWeek.properties.federal_provider_number].properties.FIPS = null;
    } else if (!zips["ZIP"+providerWeek["Provider Zip Code"]].hasOwnProperty("STCOUNTYFP")) {
      var fips = "no FIPS";
      // console.log(zipMetadata);
      // providers[providerWeek.properties.federal_provider_number].properties.FIPS = null;
    } else {
      var fips = "FIPS"+zips["ZIP"+providerWeek["Provider Zip Code"]].STCOUNTYFP.toString().padStart(5, '0');
      // console.log("real FIPS "+FIPS)
    }
    if (fpn == 'FPN015141') {
      console.log("zip= "+providerWeek["Provider Zip Code"]);
      console.log("fips= "+fips);
      // console.log(providers);
    }
    if (!counties.hasOwnProperty(fips)) {
      counties[fips] = {};
    }
    if (!counties[fips].hasOwnProperty(fpn)) {
      counties[fips][fpn] = {
        type: "feature",
        geometry: {coordinates: null},
        properties: _.pick(providerWeek, globalProperties),
        counts: {},
        fips: fips
      };
    }
    var geoLocation = re.exec(providerWeek.Geolocation);
    if (geoLocation != null) {
      coordinates = _.map(geoLocation.slice(1,3), function(d) {return Number(d);});
      if (counties[fips][fpn].geometry.coordinates == null) {
        counties[fips][fpn].geometry.coordinates = coordinates;
      } else if (!_.isEqual(counties[fips][fpn].geometry.coordinates, coordinates)) {
        console.log("GEOMETRY ERROR "+counties[fips][fpn].geometry.coordinates+", "+coordinates);
      }
    }
    return counties;
  }, {
    "no ZIP": {},
    "no FIPS": {},
  });
  return _.forEach(counties, function(v, k, c) {
    c[k] = _.values(v);
  });
}
