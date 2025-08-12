import React, { useEffect, useState } from "react";
import useAdminApi from "../../api/adminApi";
import IncidentCard from "../../components/IncidentCard";

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);

  const { fetchIncidents } = useAdminApi();
  useEffect(() => {
    fetchIncidents().then((res) => setIncidents(res.data));
  }, [fetchIncidents]);

  return (
    <div>
      <h2>Incidents</h2>
      {incidents.map((incident) => (
        <IncidentCard key={incident._id} incident={incident} />
      ))}
    </div>
  );
};

export default IncidentsPage;