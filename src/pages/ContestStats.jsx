import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  Input,
  Button,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  HStack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ReferenceLine, LineChart } from 'recharts';

function ContestStats() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [summaryStats, setSummaryStats] = useState({ avg: 0, median: 0, top: 0 });
  const [scoreDist, setScoreDist] = useState([]);
  const toast = useToast();

  const computeStatsAndDist = (scoreArr) => {
    if (!scoreArr.length) return;
    // Only include valid users for stats
    const validUsers = scoreArr.filter(u => !u.userNotFound && typeof u.customScore === 'number');
    if (!validUsers.length) {
      setSummaryStats({ avg: 0, median: 0, top: 0 });
      setScoreDist([]);
      return;
    }
    const scoresOnly = validUsers.map(u => u.customScore).sort((a, b) => a - b);
    const avg = (scoresOnly.reduce((a, b) => a + b, 0) / scoresOnly.length).toFixed(2);
    const median = scoresOnly.length % 2 === 0 ?
      ((scoresOnly[scoresOnly.length/2-1] + scoresOnly[scoresOnly.length/2]) / 2).toFixed(2) :
      scoresOnly[Math.floor(scoresOnly.length/2)].toFixed(2);
    const top = scoresOnly[scoresOnly.length-1];
    setSummaryStats({ avg, median, top });
    // Histogram bins (fixed interval of 100)
    const min = Math.min(...scoresOnly);
    const max = Math.max(...scoresOnly);
    const binSize = 100;
    const binCount = Math.max(1, Math.ceil((max - min + 1) / binSize));
    const bins = Array(binCount).fill(0);
    scoresOnly.forEach(score => {
      const idx = Math.min(binCount - 1, Math.floor((score - min) / binSize));
      bins[idx]++;
    });
    const dist = bins.map((count, i) => {
      const rangeStart = min + i * binSize;
      const rangeEnd = Math.min(max, rangeStart + binSize - 1);
      return { range: `${rangeStart}-${rangeEnd}`, count };
    });
    setScoreDist(dist);
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setScores([]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData.length || !jsonData[0].username || !jsonData[0].name) {
            throw new Error('Invalid Excel format. Please ensure the file has "name" and "username" columns.');
          }

          setExcelData(jsonData);
          toast({
            title: 'Success',
            description: 'Excel file loaded successfully. Click Submit to process rankings.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (err) {
          setError(err.message);
          setExcelData(null);
          toast({
            title: 'Error',
            description: err.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Error processing file');
      setExcelData(null);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!excelData) return;

    try {
      setLoading(true);
      setError(null);
      setScores([]);
      setActiveCount(0);
      setTotalCount(0);
      let allScores = [];
      const usernames = excelData.map(row => row.username);
      const batchSize = 50; // You can adjust this size
      let batchCount = Math.ceil(usernames.length / batchSize);
      let batchResults = [];
      for (let i = 0; i < batchCount; i++) {
        const batch = usernames.slice(i * batchSize, (i + 1) * batchSize);
        // Show progress toast
        toast({
          title: `Processing batch ${i + 1} of ${batchCount}`,
          status: 'info',
          duration: 1500,
          isClosable: true,
        });
        try {
          const response = await axios.post('https://leetcode-server-seven.vercel.app/api/users/scores', { usernames: batch });
          if (response.data && response.data.scores) {
            batchResults = batchResults.concat(response.data.scores);
          }
        } catch (err) {
          // If a batch fails, continue with others
          toast({
            title: `Batch ${i + 1} failed`,
            description: err.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
      // Only count valid users for stats
      const validUsers = batchResults.filter(u => !u.userNotFound && typeof u.customScore === 'number');
      setActiveCount(validUsers.filter(u => u.isActive).length);
      setTotalCount(validUsers.length);
      const rankedScores = batchResults
        .sort((a, b) => {
          if (a.userNotFound && !b.userNotFound) return 1;
          if (!a.userNotFound && b.userNotFound) return -1;
          if (a.userNotFound && b.userNotFound) return 0;
          return b.customScore - a.customScore;
        })
        .map((user, index, arr) => ({
          ...user,
          rank: !user.userNotFound ? (arr.slice(0, index+1).filter(u => !u.userNotFound).length) : '-',
          name: excelData.find(row => row.username === user.username)?.name || 'N/A'
        }));
      setScores(rankedScores);
      computeStatsAndDist(rankedScores);
      toast({
        title: 'Success',
        description: 'Rankings processed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert status="error" mt={8}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <VStack spacing={8} align="stretch" p={8}>
      <Box>
        <Heading size="xl" mb={6}>LeetCode Contest Rankings</Heading>
        <HStack spacing={4} mb={6}>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!excelData || loading}
          >
            Submit
          </Button>
        </HStack>
        {totalCount > 0 && (
          <Box mb={4}>
            <Text fontWeight="bold" fontSize="lg">
              Active in last 7 days: {activeCount} / {totalCount}
            </Text>
            {/* Pie chart placeholder, can be replaced with a real chart library */}
            <Box w="120px" h="120px" position="relative" mt={2}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="#e2e8f0" />
                <path
                  d={`M60,60 L60,6 A54,54 0 ${activeCount/totalCount>0.5?1:0},1 ${60+54*Math.sin(2*Math.PI*activeCount/totalCount)},${60-54*Math.cos(2*Math.PI*activeCount/totalCount)} Z`}
                  fill="#3182ce"
                />
                <circle cx="60" cy="60" r="40" fill="#fff" />
                <text x="60" y="68" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#3182ce">{activeCount}</text>
              </svg>
            </Box>
          </Box>
        )}
      </Box>
      {scores.length > 0 && (
        <Box mb={8}>
          <Heading size="md" mb={2}>Score Distribution</Heading>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDist} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3182ce" />
              {/* Overlay a smooth line to mimic Gaussian if possible */}
              <Line type="monotone" dataKey="count" stroke="#e53e3e" strokeWidth={2} dot={false} />
              {/* Gaussian-like curve overlay */}
              {scoreDist.length > 2 && (
                <Line
                  type="monotone"
                  dataKey="gauss"
                  stroke="#805ad5"
                  strokeWidth={2}
                  isAnimationActive={false}
                  data={(() => {
                    // Interpolate histogram bins to create a smooth bell curve
                    const points = [];
                    const n = 60; // number of points for smoothness
                    const min = scoreDist[0].range.split('-')[0]*1;
                    const max = scoreDist[scoreDist.length-1].range.split('-')[1]*1;
                    const mean = Number(summaryStats.avg);
                    const std = (() => {
                      // Estimate stddev from histogram
                      let allScores = [];
                      scoreDist.forEach((bin, i) => {
                        const [start, end] = bin.range.split('-').map(Number);
                        const mid = (start + end) / 2;
                        for (let j = 0; j < bin.count; j++) allScores.push(mid);
                      });
                      const avg = allScores.reduce((a,b)=>a+b,0)/allScores.length;
                      const variance = allScores.reduce((a,b)=>a+(b-avg)**2,0)/allScores.length;
                      return Math.sqrt(variance) || 1;
                    })();
                    // Gaussian formula
                    const gauss = x => {
                      return (1/(std*Math.sqrt(2*Math.PI))) * Math.exp(-0.5*((x-mean)/std)**2);
                    };
                    // Scale gaussian to histogram max
                    const maxCount = Math.max(...scoreDist.map(b=>b.count));
                    let maxGauss = 0;
                    for (let i = 0; i < n; i++) {
                      const x = min + (max-min)*i/(n-1);
                      const y = gauss(x);
                      if (y > maxGauss) maxGauss = y;
                    }
                    for (let i = 0; i < n; i++) {
                      const x = min + (max-min)*i/(n-1);
                      const y = gauss(x) * (maxCount / maxGauss);
                      points.push({ range: x, gauss: y });
                    }
                    return points;
                  })()}
                  dot={false}
                  connectNulls
                />
              )}
              {/* Mean vertical line */}
              <ReferenceLine x={(() => {
                // Find the bin containing the mean
                const mean = Number(summaryStats.avg);
                let idx = scoreDist.findIndex(bin => {
                  const [start, end] = bin.range.split('-').map(Number);
                  return mean >= start && mean <= end;
                });
                return idx !== -1 ? scoreDist[idx].range : undefined;
              })()} stroke="#38a169" label={{ value: 'Mean', position: 'top', fill: '#38a169' }} />
            </BarChart>
          </ResponsiveContainer>
          <HStack mt={4} spacing={8} justify="center">
            <Box><Text fontWeight="bold">Average</Text><Text>{summaryStats.avg}</Text></Box>
            <Box><Text fontWeight="bold">Median</Text><Text>{summaryStats.median}</Text></Box>
            <Box><Text fontWeight="bold">Top Score</Text><Text>{summaryStats.top}</Text></Box>
          </HStack>
        </Box>
      )}
      {loading ? (
        <Skeleton height="400px" />
      ) : scores.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Name</Th>
              <Th>Username</Th>
              <Th isNumeric>Score</Th>
              <Th>Recent Active Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {scores.map((user) => (
              <Tr key={user.username}>
                <Td>{user.rank}</Td>
                <Td>{user.name}</Td>
                <Td>{user.username}</Td>
                <Td isNumeric>{user.userNotFound ? 'User Not Found' : user.customScore}</Td>
                <Td>{user.userNotFound ? 'User Not Found' : (user.recentActiveDate || 'NA')}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          Upload an Excel file with LeetCode usernames to view rankings
        </Alert>
      )}
    </VStack>
  );
}

export default ContestStats;