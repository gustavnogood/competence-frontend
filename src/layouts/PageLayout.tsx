import NavBarLayout from "../components/navigation/NavBarLayout";

type Props = {
    children?: React.ReactNode;
};

export const PageLayout: React.FC<Props> = ({children}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <NavBarLayout />
            {children}
        </div>
    );
};