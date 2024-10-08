import React, { useRef, useEffect, useState, useCallback } from "react";
import { MyTreeNodeDatum } from "./Types";
import { useMsal, useAccount } from "@azure/msal-react";
import { callMsGraph } from "../../utils/callMsGraph";
import axiosInstance from "../../axios/axiosInstance";
import { debounce } from 'lodash';

interface UserData {
    displayName: string;
    id: string;
    nodeId?: string;
}

interface TreeNodeProps {
    nodeDatum: MyTreeNodeDatum;
    toggleNode: () => void;
    userData?: UserData | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({ nodeDatum, toggleNode, userData }) => {
    const ref = useRef<SVGGElement>(null);
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [userDataState, setUserDataState] = useState<UserData | null>(null);

    const fetchUserData = useCallback(async () => {
        if (account) {
            try {
                const response = await instance.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: account
                });
                const result = await callMsGraph(response.accessToken);
                setUserDataState({ displayName: result.displayName, id: result.id });
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }
    }, [account, instance]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const addNodeToUser = useCallback(debounce(async (nodeId: string) => {
        const currentUserData = userData || userDataState;
        if (!currentUserData) {
            console.error('User data is not available');
            return;
        }

        try {
            const response = await axiosInstance.post('/users', {
                id: "1",
                UserId: currentUserData.id,
                DisplayName: currentUserData.displayName,
                RoadmapId: nodeId
            });
            console.log('User updated successfully:', response.data);
        } catch (error: any) {
            if (error.response) {
                console.error('Error updating user:', error.response.data);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error in setting up request:', error.message);
            }
        }
    }, 300), [userData, userDataState]); // Adjust the debounce time as necessary

    return (
        <g ref={ref} onClick={() => toggleNode()} style={{ cursor: 'pointer' }}>
            <rect width={100} height={50} stroke="black" fill="white" />
            <foreignObject x="0" y="0" width={100} height={50}>
                <div style={{ width: '100px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                    {nodeDatum.name}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('you clicked:', nodeDatum.id, nodeDatum.name);
                            addNodeToUser(nodeDatum.id);
                        }}
                    >
                        ✓
                    </button>
                </div>
            </foreignObject>
        </g>
    );
};

export default TreeNode;
