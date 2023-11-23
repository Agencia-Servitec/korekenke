import React from "react";
import {
  AddButton,
  AlignmentWrapper,
  Button,
  Col,
  Legend,
  modalConfirm,
  notification,
  Row,
  Spin,
} from "../../components/ui";
import { useGlobalData } from "../../providers";
import ReservationsTable from "./Reservations.Table";
import { ReservationModalProvider } from "./Reservation.ModalProvider";
import ReservationsFinder from "./Reservations.Finder";
import ReservationsFilters from "./Reservations.Filters";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { receptionsRef } from "../../firebase/collections";
import { firestoreTimestamp } from "../../firebase/firestore";
import { searchify } from "../../utils";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router";
import { useDebounce, useQueriesState } from "../../hooks";
import moment from "moment";
import { faEye } from "@fortawesome/free-solid-svg-icons";

export const ReservationsIntegration = () => {
  const navigate = useNavigate();

  const { users } = useGlobalData();

  const [searchFields, setSearchFields] = useQueriesState({
    createAt: moment().format("YYYY-MM-DD"),
    searchTerm: undefined,
  });

  const debouncedSearchFields = useDebounce(searchFields, 750);

  const [receptions = [], receptionsLoading, receptionsError] =
    useCollectionData(reservationsQuery(debouncedSearchFields));

  const onDeleteReservation = async (receptionId) => {
    console.log("delete", receptionId);

    notification({ type: "success" });
  };

  const onNavigateTo = (pathname) => navigate(pathname);

  return (
    <ReservationModalProvider users={users} drivers={users}>
      <Spin size="large" spinning={receptionsLoading}>
        <Reservation
          onNavigateTo={onNavigateTo}
          receptions={receptions}
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          onDeleteReservation={onDeleteReservation}
        />
      </Spin>
    </ReservationModalProvider>
  );
};

const Reservation = ({
  setSearchFields,
  searchFields,
  receptions,
  onNavigateTo,
  onDeleteReservation,
}) => {
  const [reservationsFilter, setReservationsFilter] = useQueriesState({
    status: "all",
    districtId: "all",
    companyId: "all",
  });

  const onReceptionsSearch = (searchFields) => setSearchFields(searchFields);

  const onReceptionsFilter = (filter) => setReservationsFilter(filter);

  const onClickReservationAdd = () => navigateToReceptionPage("new");

  const onConfirmDeleteReception = (receptionId) =>
    modalConfirm({
      title: "¿Estás seguro de que quieres eliminar la recepcion?",
      onOk: () => onDeleteReservation(receptionId),
    });

  const onClickDeleteReception = (receptionId) =>
    onConfirmDeleteReception(receptionId);

  const navigateToReceptionPage = (receptionId) => {
    const url = `/receptions/${receptionId}`;
    onNavigateTo(url);
  };

  const filteredReservationsView = receptions.filter((reception) => reception);

  return (
    <Container>
      <div>
        <Legend title="Buscar">
          <ReservationsFinder
            searchFields={searchFields}
            onSearch={onReceptionsSearch}
          />
        </Legend>
      </div>
      <div>
        <Legend title="Filtros">
          <ReservationsFilters
            filter={reservationsFilter}
            onFilter={onReceptionsFilter}
          />
        </Legend>
      </div>
      <div>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col sm={24} md={12}>
            <AlignmentWrapper align="start">
              <AddButton
                onClick={onClickReservationAdd}
                title="RESERVA"
                margin="0"
              />
            </AlignmentWrapper>
          </Col>
          <Col sm={24} md={12}>
            <AlignmentWrapper align="end">
              <Button type="primary">
                <FontAwesomeIcon icon={faEye} /> &nbsp; CONDUCTORES DISPONIBLES
              </Button>
            </AlignmentWrapper>
          </Col>
        </Row>
      </div>
      <div>
        <ReservationsTable
          reservations={filteredReservationsView}
          onClickDeleteReservation={onClickDeleteReception}
        />
      </div>
    </Container>
  );
};

const reservationsQuery = ({ searchTerm, createAt }) => {
  let query = receptionsRef
    .where("isDeleted", "==", false)
    .orderBy("createAt", "desc");

  if (searchTerm) {
    query = query.where(
      "_search",
      "array-contains-any",
      searchify(searchTerm.split(" "))
    );
  }

  if (createAt) {
    const [startDate, endDate] = dateRange(createAt);

    query = query
      .startAt(firestoreTimestamp.fromDate(endDate))
      .endAt(firestoreTimestamp.fromDate(startDate));
  }

  return query.limit(3000);
};

const dateRange = (date) => {
  const startDate = moment(date, "YYYY-MM-DD").startOf("day").toDate();
  const endDate = moment(date, "YYYY-MM-DD").endOf("day").toDate();

  return [startDate, endDate];
};

const Container = styled.div`
  display: flex;
  gap: 1rem;
  flex-direction: column;
`;
