import React from 'react';
import './App.css';
import { useQuery, gql } from '@apollo/client';

function Mailbox() {
    const { loading, data } = useQuery(QUERY);

    if (!loading) {
        console.log(data);
    }
    return <div>Loading {JSON.stringify(data)}</div>;
}

const QUERY = gql`
    query {
        mailbox {
            getMailboxSyncStatus {
                numMessagesSeen
            }
        }
    }
`;

export default Mailbox;
