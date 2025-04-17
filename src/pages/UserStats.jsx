import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  VStack,
  Skeleton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import axios from 'axios';

function UserStats() {
  const { username } = useParams();
  const [customScore, setCustomScore] = useState(null);
  const [recentActiveDate, setRecentActiveDate] = useState('NA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`https://leetcode-server-seven.vercel.app/api/user/${username}`);
        setCustomScore(response.data.customScore);
        setRecentActiveDate(response.data.recentActiveDate || 'NA');
      } catch (err) {
        setError('Error fetching user data. Please check the username and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  if (loading) {
    return (
      <Box p={8}>
        <Skeleton height="100px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={8}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (customScore === 'User Not Found') {
    return (
      <Alert status="info" mt={8}>
        <AlertIcon />
        User not found
      </Alert>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="xl" mb={6}>LeetCode Statistics</Heading>
        <StatGroup>
          <Stat>
            <StatLabel>Custom Score</StatLabel>
            <StatNumber>{customScore === 'User Not Found' ? 'User Not Found' : customScore}</StatNumber>
            <Text fontSize="sm" color="gray.500">
              Based on rating and problems solved
            </Text>
          </Stat>
          <Stat>
            <StatLabel>Recent Active Date</StatLabel>
            <StatNumber>{recentActiveDate === 'User Not Found' ? 'User Not Found' : recentActiveDate}</StatNumber>
            <Text fontSize="sm" color="gray.500">
              Most recent accepted submission
            </Text>
          </Stat>
        </StatGroup>
      </Box>
    </VStack>
  );
}

export default UserStats;