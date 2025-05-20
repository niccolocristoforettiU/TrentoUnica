<template>
  <GMapMap
    :center="defaultCenter"
    :zoom="14"
    style="width: 100%; height: 400px"
  >
    <GMapMarker
      v-for="(marker, index) in markerData"
      :key="index"
      :position="{ lat: marker.lat, lng: marker.lon }"
    />
  </GMapMap>
</template>

<script>
export default {
  name: 'MapLocation',
  props: {
    locations: {
      type: Array,
      default: () => [
        {
          address: 'Trento centro',
          lat: 46.0700,
          lon: 11.1190
        }
      ]
    }
  },
  computed: {
    markerData() {
      return this.locations.length ? this.locations : [{
        address: 'Trento centro',
        lat: 46.0700,
        lon: 11.1190
      }];
    },
    defaultCenter() {
      return {
        lat: this.markerData[0].lat,
        lng: this.markerData[0].lon
      };
    }
  }
};
</script>
