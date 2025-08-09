import React, { useEffect, useState } from "react";
import { fetchIncidents } from "../../api/adminApi";
import IncidentCard from "../../components/IncidentCard";

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetchIncidents().then((res) => setIncidents(res.data));
  }, []);

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
